# main.py - FINAL WORKING VERSION (CASE-SENSITIVE IMPORT FIXED)

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from google_auth_oauthlib.flow import Flow
from collections import defaultdict
from time import time
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleAuthRequest
from pymongo import MongoClient, ReturnDocument
import asyncio
import hashlib
import os
import requests
import jwt as pyjwt
from datetime import datetime, timedelta, timezone
import logging
from pydantic import BaseModel
import secrets
import uuid
import json
from typing import Any, Dict, Optional
from services.youtube import (
    get_youtube_service,
    fetch_subscriptions,
    fetch_subscription_genres,
    fetch_saved_videos,
    determine_music_and_genres,
    fetch_playlists,
    count_music_watch_times,
    execute_with_retry
)
from services.comparison import compare_interests_logic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

rate_limit_store = defaultdict(lambda: defaultdict(list))


def _rate_limit_rule(request: Request):
    """Return a stable bucket and request limit for sensitive dynamic routes."""
    path = request.url.path
    if path.startswith("/api/"):
        path = path[4:]

    segments = [segment for segment in path.split("/") if segment]
    if len(segments) == 3 and segments[:2] == ["compare", "join"]:
        return "compare_join", 20
    if len(segments) == 3 and segments[:2] == ["compare", "run"]:
        return "compare_run", 60 if request.method == "GET" else 20
    if segments == ["auth", "refresh"]:
        return "auth_refresh", 30
    return None

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        rule = _rate_limit_rule(request)

        if rule:
            bucket, request_limit = rule
            now = time()
            rate_limit_store[client_ip][bucket] = [
                t for t in rate_limit_store[client_ip][bucket] if now - t < 60
            ]

            if len(rate_limit_store[client_ip][bucket]) >= request_limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Try again later."},
                    headers={"Retry-After": "60"},
                )

            rate_limit_store[client_ip][bucket].append(now)

        return await call_next(request)

app.add_middleware(RateLimitMiddleware)

def generate_secure_code() -> str:
    """Generate a cryptographically secure random code for comparison links."""
    return secrets.token_urlsafe(16)

def validate_redirect_target(target: Optional[str]) -> str:
    """Validate and sanitize redirect target."""
    if not target:
        return '/dashboard'

    target_path = f'/{target.lstrip("/")}'
    if target_path == '/dashboard':
        return target_path
    if target_path.startswith('/compare/finalise/') and len(target_path.split('/')) == 4:
        return target_path
    return '/dashboard'

def build_redirect_uri() -> str:
    """Build a redirect URI for Google OAuth.
    - If DEPLOYED_DOMAIN is set and contains a scheme, use it directly.
    - If DEPLOYED_DOMAIN is set without scheme, assume https.
    - If not set, fall back to localhost with http for local dev.
    """
    deployed = os.getenv('DEPLOYED_DOMAIN')
    if deployed:
        deployed = deployed.rstrip('/')
        if deployed.startswith('http://') or deployed.startswith('https://'):
            return f"{deployed}/auth/callback"
        return f"https://{deployed}/auth/callback"
    host = os.getenv('DEV_HOST', 'localhost:8000')
    scheme = 'http' if 'localhost' in host or host.startswith('127.') else 'https'
    return f"{scheme}://{host}/auth/callback"

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
frontend_origin = frontend_url.rstrip('/')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient(os.getenv("MONGO_URI"), serverSelectionTimeoutMS=10000)
db = client["youtube-blend"]
users = db.users
auth_states = db.auth_states
auth_codes = db.auth_codes
comparisons = db.comparisons
app_sessions = db.app_sessions

try:
    auth_states.create_index("expires_at", expireAfterSeconds=0)
    auth_codes.create_index("expires_at", expireAfterSeconds=0)
    comparisons.create_index("expires_at", expireAfterSeconds=0)
    app_sessions.create_index("expires_at", expireAfterSeconds=0)
    app_sessions.create_index("refresh_token_hash", unique=True)
    app_sessions.create_index([("google_id", 1), ("expires_at", 1)])
except Exception:
    logger.exception("Failed to ensure TTL indexes on collections")

SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

ACCESS_TOKEN_MINUTES = 30
APP_SESSION_DAYS = max(1, int(os.getenv("APP_SESSION_DAYS", "30")))


def _utcnow() -> datetime:
    return datetime.utcnow()


def _parse_expiry(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _credentials_for_storage(creds: Credentials) -> Dict[str, Any]:
    """Serialize only the credential fields required to call Google again."""
    payload: Dict[str, Any] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri or "https://oauth2.googleapis.com/token",
        "client_id": creds.client_id or os.getenv("GOOGLE_CLIENT_ID"),
        "scopes": list(creds.scopes or SCOPES),
    }
    if creds.expiry:
        payload["expiry"] = creds.expiry.isoformat()
    return payload


def _refresh_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _issue_access_token(google_id: str, session_id: Optional[str] = None) -> str:
    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="Authentication is not configured")

    now = _utcnow()
    payload: Dict[str, Any] = {
        "sub": google_id,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "jti": uuid.uuid4().hex,
    }
    if session_id:
        payload["sid"] = session_id
    return pyjwt.encode(payload, jwt_secret, algorithm="HS256")


def _create_app_session(google_id: str) -> Dict[str, str]:
    """Create an app session while storing only a digest of its refresh token."""
    now = _utcnow()
    refresh_token = secrets.token_urlsafe(64)
    session_id = uuid.uuid4().hex
    app_sessions.insert_one({
        "session_id": session_id,
        "google_id": google_id,
        "refresh_token_hash": _refresh_token_hash(refresh_token),
        "created_at": now,
        "last_used_at": now,
        "expires_at": now + timedelta(days=APP_SESSION_DAYS),
        "rotation_count": 0,
    })
    return {
        "access_token": _issue_access_token(google_id, session_id),
        "refresh_token": refresh_token,
    }


def _revoke_app_sessions(google_id: str) -> None:
    now = _utcnow()
    app_sessions.update_many(
        {"google_id": google_id, "revoked_at": {"$exists": False}},
        {"$set": {"revoked_at": now, "expires_at": now}},
    )

async def verify_token(authorization: str = Header(None)):
    """Verify JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        token = authorization.removeprefix("Bearer ").strip()
        jwt_secret = os.getenv('JWT_SECRET')
        if not jwt_secret:
            raise HTTPException(status_code=500, detail='Authentication is not configured')

        payload = pyjwt.decode(token, jwt_secret, algorithms=['HS256'])
        if payload.get("type") not in (None, "access"):
            raise HTTPException(status_code=401, detail="Invalid token")
        google_id = payload.get('sub')
        if not google_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        session_id = payload.get('sid')
        if session_id and not app_sessions.find_one({
            'session_id': session_id,
            'google_id': google_id,
            'expires_at': {'$gt': _utcnow()},
            'revoked_at': {'$exists': False},
        }):
            raise HTTPException(status_code=401, detail="Session is no longer active")
        return google_id
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_credentials_from_db(google_id: str) -> Optional[Credentials]:
    """Get and refresh credentials from database."""
    doc = users.find_one({'google_id': google_id})
    if not doc:
        return None

    token_raw = doc.get('token_json')
    if not token_raw:
        return None

    try:
        token_data = json.loads(token_raw) if isinstance(token_raw, str) else token_raw
        creds = Credentials(
            token=token_data.get('token') or token_data.get('access_token'),
            refresh_token=token_data.get('refresh_token'),
            token_uri=token_data.get('token_uri', 'https://oauth2.googleapis.com/token'),
            client_id=token_data.get('client_id') or os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            scopes=token_data.get('scopes', SCOPES),
            expiry=_parse_expiry(token_data.get("expiry")),
        )

        if creds.expired and creds.refresh_token:
            logger.info("Refreshing Google credentials for authenticated user")
            creds.refresh(GoogleAuthRequest())
            users.update_one(
                {'google_id': google_id},
                {'$set': {'token_json': _credentials_for_storage(creds), 'updated_at': _utcnow()}}
            )
        return creds if creds.valid else None
    except Exception:
        logger.exception("Failed to load or refresh Google credentials")
        return None

@app.get("/")
async def root():
    return {"message": "Blend API is live"}

def detect_item_changes(new_item: dict, old_item: dict) -> dict:
    """Detect what fields changed between old and new item."""
    changes = {}

    comparable_fields = ['title', 'description', 'thumbnail_url', 'genre', 'watch_count']

    for field in comparable_fields:
        new_val = new_item.get(field)
        old_val = old_item.get(field)

        if new_val != old_val:
            changes[field] = {
                'old': old_val,
                'new': new_val
            }

    return changes

def cache_user_data(google_id: str, data: dict):
    """Store user's YouTube data in MongoDB with smart incremental updates."""
    try:
        existing_doc = users.find_one({'google_id': google_id})
        existing_data = existing_doc.get('cached_data', {}) if existing_doc else {}

        new_sub_ids = {s['channel_id']: s for s in data.get('subscriptions', [])}
        old_sub_ids = {s['channel_id']: s for s in existing_data.get('subscriptions', [])}

        new_video_ids = {v['video_id']: v for v in data.get('saved_videos', [])}
        old_video_ids = {v['video_id']: v for v in existing_data.get('saved_videos', [])}

        new_music_ids = {m['video_id']: m for m in data.get('music_listened', [])}
        old_music_ids = {m['video_id']: m for m in existing_data.get('music_listened', [])}

        updated_subscriptions = []
        added_subs = 0
        changed_subs = 0

        for channel_id, new_sub in new_sub_ids.items():
            old_sub = old_sub_ids.get(channel_id)

            if not old_sub:
                new_sub['added_at'] = datetime.utcnow()
                new_sub['last_synced_at'] = datetime.utcnow()
                added_subs += 1
            else:
                changes = detect_item_changes(new_sub, old_sub)

                if changes:
                    new_sub['added_at'] = old_sub.get('added_at', datetime.utcnow())
                    new_sub['updated_at'] = datetime.utcnow()
                    new_sub['last_synced_at'] = datetime.utcnow()
                    new_sub['changes'] = changes
                    changed_subs += 1
                    logger.info(f"Updated subscription {channel_id}: {list(changes.keys())}")
                else:
                    new_sub['added_at'] = old_sub.get('added_at', datetime.utcnow())
                    new_sub['last_synced_at'] = datetime.utcnow()

            updated_subscriptions.append(new_sub)

        updated_videos = []
        added_vids = 0
        changed_vids = 0

        for video_id, new_video in new_video_ids.items():
            old_video = old_video_ids.get(video_id)

            if not old_video:
                new_video['added_at'] = datetime.utcnow()
                new_video['last_synced_at'] = datetime.utcnow()
                added_vids += 1
            else:
                changes = detect_item_changes(new_video, old_video)

                if changes:
                    new_video['added_at'] = old_video.get('added_at', datetime.utcnow())
                    new_video['updated_at'] = datetime.utcnow()
                    new_video['last_synced_at'] = datetime.utcnow()
                    new_video['changes'] = changes
                    changed_vids += 1
                    logger.info(f"Updated video {video_id}: {list(changes.keys())}")
                else:
                    new_video['added_at'] = old_video.get('added_at', datetime.utcnow())
                    new_video['last_synced_at'] = datetime.utcnow()

            updated_videos.append(new_video)

        updated_music = []
        added_songs = 0
        changed_songs = 0

        for music_id, new_music in new_music_ids.items():
            old_music = old_music_ids.get(music_id)

            if not old_music:
                new_music['added_at'] = datetime.utcnow()
                new_music['first_watched_at'] = datetime.utcnow()
                new_music['last_synced_at'] = datetime.utcnow()
                added_songs += 1
            else:
                changes = detect_item_changes(new_music, old_music)

                old_count = old_music.get('watch_count', 0)
                new_count = new_music.get('watch_count', 0)

                if new_count > old_count:
                    changes['watch_count'] = {
                        'old': old_count,
                        'new': new_count,
                        'increase': new_count - old_count
                    }
                    new_music['last_listened_at'] = datetime.utcnow()
                    changed_songs += 1

                if changes:
                    new_music['added_at'] = old_music.get('added_at', datetime.utcnow())
                    new_music['first_watched_at'] = old_music.get('first_watched_at', datetime.utcnow())
                    new_music['updated_at'] = datetime.utcnow()
                    new_music['last_synced_at'] = datetime.utcnow()
                    new_music['changes'] = changes
                    logger.info(f"Updated music {music_id}: {list(changes.keys())}")
                else:
                    new_music['added_at'] = old_music.get('added_at', datetime.utcnow())
                    new_music['first_watched_at'] = old_music.get('first_watched_at', datetime.utcnow())
                    new_music['last_synced_at'] = datetime.utcnow()

            updated_music.append(new_music)

        removed_subs = set(old_sub_ids.keys()) - set(new_sub_ids.keys())
        removed_vids = set(old_video_ids.keys()) - set(new_video_ids.keys())
        removed_music = set(old_music_ids.keys()) - set(new_music_ids.keys())

        merged_data = {
            'subscriptions': updated_subscriptions,
            'subscription_genres': data.get('subscription_genres', []),
            'saved_videos': updated_videos,
            'music_listened': updated_music,
            'video_genres': data.get('video_genres', []),
            'playlists': data.get('playlists', [])
        }

        users.update_one(
            {'google_id': google_id},
            {'$set': {
                'cached_data': merged_data,
                'cached_at': datetime.utcnow(),
                'total_subscriptions': len(updated_subscriptions),
                'total_videos': len(updated_videos),
                'total_music': len(updated_music),
                'sync_stats': {
                    'added_subscriptions': added_subs,
                    'changed_subscriptions': changed_subs,
                    'removed_subscriptions': len(removed_subs),
                    'added_videos': added_vids,
                    'changed_videos': changed_vids,
                    'removed_videos': len(removed_vids),
                    'added_music': added_songs,
                    'changed_music': changed_songs,
                    'removed_music': len(removed_music)
                }
            }}
        )

        logger.info(
            f"Synced {google_id}: "
            f"+{added_subs} subs ({changed_subs} updated), "
            f"+{added_vids} videos ({changed_vids} updated), "
            f"+{added_songs} songs ({changed_songs} updated)"
        )
    except Exception as e:
        logger.error(f"Failed to cache user data: {e}")

def get_cached_user_data(google_id: str, cache_validity_hours: int = 24):
    """Retrieve cached user data if it's fresh (within cache_validity_hours)."""
    try:
        doc = users.find_one({'google_id': google_id})
        if not doc or 'cached_data' not in doc:
            return None

        cached_at = doc.get('cached_at')
        if not cached_at:
            return None

        age = (datetime.utcnow() - cached_at).total_seconds() / 3600
        if age < cache_validity_hours:
            logger.info(f"Using cached data for {google_id} (age: {age:.1f}h, subs: {doc.get('total_subscriptions', 0)}, songs: {doc.get('total_music', 0)})")
            return doc['cached_data']

        logger.info(f"Cache expired for {google_id} (age: {age:.1f}h), fetching fresh data")
        return None
    except Exception as e:
        logger.error(f"Failed to retrieve cached data: {e}")
        return None

def get_user_cached_data_for_compare(google_id: str):
    """Fetch cached data, last sync timestamp, and profile for comparisons (no TTL check)."""
    try:
        if not google_id:
            return None, None, "comparison_snapshot", None

        doc = users.find_one({'google_id': google_id})
        if not doc:
            return None, None, "comparison_snapshot", None

        cached_data = doc.get('cached_data')
        last_synced_at = doc.get('cached_at') or doc.get('last_full_sync')
        profile = doc.get('profile')
        if cached_data:
            return cached_data, last_synced_at, "cached", profile

        return None, last_synced_at, "comparison_snapshot", profile
    except Exception:
        logger.exception("Failed to load cached data for comparison")
        return None, None, "comparison_snapshot", None

@app.get("/auth/login")
async def login(next: str = None, comparison_id: str = None):
    redirect_uri = build_redirect_uri()

    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "redirect_uris": [redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = redirect_uri

        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )
    except Exception:
        logger.exception("Failed to build OAuth flow")
        raise HTTPException(status_code=500, detail="Unable to start Google sign-in")

    auth_states.insert_one({
        "state": state,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5),
        "next": next,
        "comparison_id": comparison_id
    })

    return {"url": auth_url}

@app.get("/auth/callback")
async def callback(code: str, state: str):
    state_doc = auth_states.find_one_and_delete({
        "state": state,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if not state_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired login state")

    redirect_uri = build_redirect_uri()

    try:
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        token_response.raise_for_status()
        tokens = token_response.json()

        userinfo_resp = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens.get('access_token')}"},
            timeout=10,
        )
        userinfo_resp.raise_for_status()
        userinfo = userinfo_resp.json()

        google_id = userinfo.get("id")
        if not google_id:
            logger.error("Userinfo missing id: %s", userinfo)
            raise HTTPException(status_code=500, detail="Failed to retrieve Google user id")

        existing_user = users.find_one({"google_id": google_id}, {"token_json": 1})
        existing_token_data = (existing_user or {}).get("token_json") or {}
        if isinstance(existing_token_data, str):
            try:
                existing_token_data = json.loads(existing_token_data)
            except json.JSONDecodeError:
                existing_token_data = {}

        google_refresh_token = tokens.get('refresh_token') or existing_token_data.get('refresh_token')
        expires_in = tokens.get("expires_in")
        credential_expiry = _utcnow() + timedelta(seconds=int(expires_in)) if expires_in else None
        cred = Credentials(
            token=tokens.get('access_token'),
            refresh_token=google_refresh_token,
            token_uri=tokens.get('token_uri', 'https://oauth2.googleapis.com/token'),
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            scopes=SCOPES,
            expiry=credential_expiry,
        )
        profile = {
            "email": userinfo.get("email"),
            "name": userinfo.get("name"),
            "picture": userinfo.get("picture")
        }

        users.update_one(
            {"google_id": google_id},
            {"$set": {
                "token_json": _credentials_for_storage(cred),
                "profile": profile,
                "updated_at": _utcnow(),
            }},
            upsert=True
        )

        comparison_id = state_doc.get('comparison_id')
        if comparison_id:
            comparison = comparisons.find_one({'_id': comparison_id})
            if not comparison:
                raise HTTPException(status_code=400, detail="Invalid comparison link")

            if comparison.get('user1_id') and comparison.get('user1_id') != google_id:
                try:
                    creds = get_credentials_from_db(google_id)
                    if not creds:
                        users.update_one(
                            {"google_id": google_id},
                            {"$set": {
                                "token_json": _credentials_for_storage(cred),
                                "updated_at": _utcnow(),
                            }},
                            upsert=True
                        )
                        creds = get_credentials_from_db(google_id)

                    if creds:
                        youtube = get_youtube_service(creds)
                        subscriptions = fetch_subscriptions(youtube)
                        subscription_genres = fetch_subscription_genres(youtube, [s['channel_id'] for s in subscriptions])
                        saved_data = fetch_saved_videos(youtube)
                        music_listened, video_genres = determine_music_and_genres(youtube, saved_data['video_ids'])
                        playlists = fetch_playlists(youtube)

                        user2_data = {
                            'subscriptions': subscriptions,
                            'subscription_genres': subscription_genres,
                            'saved_videos': saved_data['saved_videos'],
                            'music_listened': music_listened,
                            'video_genres': video_genres,
                            'playlists': playlists,
                        }

                        cache_user_data(google_id, user2_data)
                        users.update_one(
                            {'google_id': google_id},
                            {'$set': {'last_full_sync': _utcnow()}},
                        )

                        comparisons.update_one(
                            {'_id': comparison_id},
                            {
                                '$set': {
                                    'user2_id': google_id,
                                    'user2_data': user2_data,
                                    'status': 'ready',
                                    'updated_at': datetime.utcnow()
                                }
                            }
                        )

                        auth_code = secrets.token_urlsafe(32)
                        code_doc = {
                            'code': auth_code,
                            'google_id': google_id,
                            'created_at': datetime.utcnow(),
                            'expires_at': datetime.utcnow() + timedelta(minutes=2),
                            'next': f'/compare/finalise/{comparison_id}'
                        }
                        auth_codes.insert_one(code_doc)

                        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
                        final_url = f"{frontend.rstrip('/')}/auth/complete?code={auth_code}&next=/compare/finalise/{comparison_id}"
                        return RedirectResponse(url=final_url, status_code=302)
                except Exception:
                    logger.exception("Error fetching user2 data during comparison")
                    raise HTTPException(status_code=500, detail="Unable to prepare comparison data")

        auth_code = secrets.token_urlsafe(32)
        code_doc = {
            'code': auth_code,
            'google_id': google_id,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(minutes=2),
            'next': state_doc.get('next'),
            'comparison_id': comparison_id
        }
        auth_codes.insert_one(code_doc)

        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
        final_url = f"{frontend.rstrip('/')}/auth/complete?code={auth_code}"
        if state_doc.get('next'):
            final_url += f"&next={validate_redirect_target(state_doc.get('next'))}"
        return RedirectResponse(url=final_url, status_code=302)
    except HTTPException:
        raise
    except Exception:
        logger.exception("OAuth callback failed")
        raise HTTPException(status_code=500, detail="Google sign-in could not be completed")

@app.get("/health")
async def health():
    return {"status": "bulletproof"}


class ExchangeRequest(BaseModel):
    code: str


@app.post("/auth/exchange")
async def auth_exchange(req: ExchangeRequest):
    """Exchange a single-use OAuth handoff code for an app session."""
    code_doc = auth_codes.find_one_and_delete({
        'code': req.code,
        'expires_at': {'$gt': datetime.utcnow()}
    })
    if not code_doc:
        raise HTTPException(status_code=400, detail='Invalid or expired code')

    google_id = code_doc.get('google_id')
    return {**_create_app_session(google_id), 'user_id': google_id}


@app.post("/auth/refresh")
async def refresh_token(body: dict):
    """Rotate an app refresh token and issue a fresh access token."""
    try:
        refresh_token_provided = body.get('refresh_token')
        if not refresh_token_provided:
            raise HTTPException(status_code=400, detail='Refresh token required')

        now = _utcnow()
        replacement = secrets.token_urlsafe(64)
        session = app_sessions.find_one_and_update(
            {
                'refresh_token_hash': _refresh_token_hash(refresh_token_provided),
                'expires_at': {'$gt': now},
                'revoked_at': {'$exists': False},
            },
            {
                '$set': {
                    'refresh_token_hash': _refresh_token_hash(replacement),
                    'last_used_at': now,
                    'expires_at': now + timedelta(days=APP_SESSION_DAYS),
                },
                '$inc': {'rotation_count': 1},
            },
            return_document=ReturnDocument.AFTER,
        )
        if not session:
            raise HTTPException(status_code=401, detail='Invalid refresh token')
        return {
            'access_token': _issue_access_token(session['google_id'], session['session_id']),
            'refresh_token': replacement,
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error refreshing app session")
        raise HTTPException(status_code=401, detail='Failed to refresh token')


def _revoke_google_access(google_id: str) -> None:
    doc = users.find_one({'google_id': google_id}, {'token_json': 1}) or {}
    token_data = doc.get('token_json') or {}
    if isinstance(token_data, str):
        try:
            token_data = json.loads(token_data)
        except json.JSONDecodeError:
            token_data = {}
    token = token_data.get('refresh_token') or token_data.get('token')
    if token:
        try:
            requests.post('https://oauth2.googleapis.com/revoke', params={'token': token}, timeout=10)
        except requests.RequestException:
            logger.warning("Google token revocation could not be confirmed")


@app.post('/auth/disconnect')
async def disconnect_google(google_id: str = Depends(verify_token)):
    _revoke_google_access(google_id)
    _revoke_app_sessions(google_id)
    users.update_one({'google_id': google_id}, {'$unset': {'token_json': ''}, '$set': {'updated_at': _utcnow()}})
    return {'success': True}


@app.delete('/account')
async def delete_account(google_id: str = Depends(verify_token)):
    _revoke_google_access(google_id)
    app_sessions.delete_many({'google_id': google_id})
    comparisons.delete_many({'$or': [{'user1_id': google_id}, {'user2_id': google_id}]})
    auth_codes.delete_many({'google_id': google_id})
    users.delete_one({'google_id': google_id})
    return {'success': True}


@app.get("/data/me")
async def get_my_data(google_id: str = Depends(verify_token)):
    """Get authenticated user's YouTube data from cache (instant response)."""
    try:
        doc = users.find_one({'google_id': google_id})
        if doc and 'cached_data' in doc:
            cached_data = doc['cached_data']
            return {
                'subscriptions': cached_data.get('subscriptions', []),
                'subscription_genres': cached_data.get('subscription_genres', []),
                'saved_videos': cached_data.get('saved_videos', []),
                'music_listened': cached_data.get('music_listened', []),
                'video_genres': cached_data.get('video_genres', []),
                'playlists': cached_data.get('playlists', []),
                'cached': True,
                'last_synced_at': doc.get('last_full_sync'),
                'profile': doc.get('profile', {}),
                'user_id': google_id
            }

        return {
            'subscriptions': [],
            'subscription_genres': [],
            'saved_videos': [],
            'music_listened': [],
            'video_genres': [],
            'playlists': [],
            'cached': False,
            'message': 'No data cached yet. Call /data/sync to fetch your YouTube data.',
            'profile': doc.get('profile', {}) if doc else {},
            'user_id': google_id
        }
    except Exception as e:
        logger.exception("Error getting cached data")
        raise HTTPException(status_code=500, detail=f"Failed to get user data: {str(e)}")


@app.post("/data/sync")
async def sync_user_data(google_id: str = Depends(verify_token)):
    """
    Smart Sync Architecture with Quota Protection:
    1. FIRST LOGIN: Fetch ALL YouTube data, save to DB (full sync)
    2. SUBSEQUENT LOGINS: Fetch fresh from YouTube, compare to DB, only update what changed (incremental)
    3. QUOTA EXCEEDED: Return cached data gracefully instead of failing
    """
    try:
        creds = get_credentials_from_db(google_id)
        if not creds:
            raise HTTPException(status_code=401, detail="Invalid or expired credentials")

        doc = users.find_one({'google_id': google_id})
        is_first_sync = doc is None or doc.get('cached_data') is None

        logger.info(f"{'🚀 FIRST SYNC (Full fetch)' if is_first_sync else '♻️ INCREMENTAL SYNC'} for {google_id}")

        loop = asyncio.get_event_loop()

        logger.info("⏳ Fetching fresh data from YouTube...")
        subscriptions_client = get_youtube_service(creds)
        saved_videos_client = get_youtube_service(creds)
        subscriptions_result, saved_data = await asyncio.gather(
            loop.run_in_executor(None, fetch_subscriptions, subscriptions_client, True),
            loop.run_in_executor(None, fetch_saved_videos, saved_videos_client),
            return_exceptions=True
        )

        subscriptions_complete = True
        if isinstance(subscriptions_result, Exception):
            subscriptions = subscriptions_result
        elif isinstance(subscriptions_result, tuple):
            subscriptions, subscriptions_complete = subscriptions_result
        else:
            subscriptions = subscriptions_result

        quota_exceeded = False
        if isinstance(subscriptions, Exception) and "quotaExceeded" in str(subscriptions):
            quota_exceeded = True
            logger.warning("⚠️  QUOTA EXCEEDED during subscriptions fetch")
        if isinstance(saved_data, Exception) and "quotaExceeded" in str(saved_data):
            quota_exceeded = True
            logger.warning("⚠️  QUOTA EXCEEDED during saved videos fetch")

        if quota_exceeded and not is_first_sync:
            logger.info("💾 Quota exceeded - returning cached data instead")
            cached_data = doc.get('cached_data', {})
            return {
                'success': True,
                'sync_type': 'CACHED',
                'subscriptions': cached_data.get('subscriptions', []),
                'subscription_genres': cached_data.get('subscription_genres', []),
                'saved_videos': cached_data.get('saved_videos', []),
                'music_listened': cached_data.get('music_listened', []),
                'video_genres': cached_data.get('video_genres', []),
                'playlists': cached_data.get('playlists', []),
                'last_synced_at': doc.get('last_full_sync'),
                'message': '⚠️  API quota exceeded. Returning cached data. Please try again later.',
                'warning': 'quotaExceeded'
            }

        if isinstance(subscriptions, Exception):
            logger.error(f"❌ Error fetching subscriptions: {subscriptions}")
            subscriptions = []

        use_cached_subs = False
        cached_subscriptions = []
        cached_sub_genres = []
        if not subscriptions_complete and doc:
            cached_subscriptions = doc.get('last_complete_subscriptions') or doc.get('cached_data', {}).get('subscriptions', [])
            cached_sub_genres = doc.get('last_complete_subscription_genres') or doc.get('cached_data', {}).get('subscription_genres', [])
            if cached_subscriptions:
                logger.warning(
                    "Subscriptions fetch incomplete; using cached subscriptions (%d) instead of partial (%d)",
                    len(cached_subscriptions),
                    len(subscriptions)
                )
                subscriptions = cached_subscriptions
                use_cached_subs = True
            else:
                logger.warning("Subscriptions fetch incomplete; no cached subscriptions available.")

        if isinstance(saved_data, Exception):
            logger.error(f"❌ Error fetching saved videos: {saved_data}")
            saved_data = {'video_ids': [], 'saved_videos': []}

        logger.info(f"✅ Fresh YouTube data fetched:")
        logger.info(f"   - {len(subscriptions)} subscriptions")
        logger.info(f"   - {len(saved_data.get('saved_videos', []))} saved videos")

        try:
            music_client = get_youtube_service(creds)
            music_listened, video_genres = await loop.run_in_executor(
                None,
                determine_music_and_genres,
                music_client,
                saved_data.get('video_ids', [])
            )
        except Exception as e:
            logger.error(f"❌ Error determining music/genres: {str(e)}")
            logger.exception("Music determination crashed")
            music_listened, video_genres = [], []

        if use_cached_subs:
            subscription_genres = cached_sub_genres
        else:
            try:
                genres_client = get_youtube_service(creds)
                subscription_genres = await loop.run_in_executor(None, fetch_subscription_genres, genres_client, subscriptions)
            except Exception as e:
                logger.error(f"❌ Error fetching subscription genres: {str(e)}")
                subscription_genres = []

        if subscriptions_complete:
            users.update_one(
                {'google_id': google_id},
                {'$set': {
                    'last_complete_subscriptions': subscriptions,
                    'last_complete_subscription_genres': subscription_genres,
                    'last_complete_subscriptions_at': datetime.utcnow()
                }}
            )

        try:
            playlists_client = get_youtube_service(creds)
            playlists = await loop.run_in_executor(None, fetch_playlists, playlists_client)
        except Exception as e:
            logger.error(f"❌ Error fetching playlists: {str(e)}")
            playlists = []

        fresh_user_data = {
            'subscriptions': subscriptions,
            'subscription_genres': subscription_genres,
            'saved_videos': saved_data.get('saved_videos', []),
            'music_listened': music_listened,
            'video_genres': video_genres,
            'playlists': playlists
        }

        logger.info(f"💾 Storing to database (with incremental comparison)...")
        cache_user_data(google_id, fresh_user_data)

        sync_time = datetime.utcnow()
        users.update_one({'google_id': google_id}, {'$set': {'last_full_sync': sync_time}})

        logger.info(f"✅ SYNC COMPLETE:")
        logger.info(f"   📊 {len(subscriptions)} channels")
        logger.info(f"   🎬 {len(saved_data.get('saved_videos', []))} saved videos")
        logger.info(f"   🎵 {len(music_listened)} music tracks")
        logger.info(f"   📁 {len(playlists)} playlists")

        return {
            'success': True,
            'sync_type': 'FULL' if is_first_sync else 'INCREMENTAL',
            'subscriptions': subscriptions,
            'subscription_genres': subscription_genres,
            'saved_videos': saved_data.get('saved_videos', []),
            'music_listened': music_listened,
            'video_genres': video_genres,
            'playlists': playlists,
            'last_synced_at': sync_time,
            'message': f'{"🚀 FULL SYNC" if is_first_sync else "♻️ INCREMENTAL SYNC"}: {len(subscriptions)} channels, {len(music_listened)} songs, {len(playlists)} playlists'
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"CRITICAL ERROR in sync: {str(e)}")
        try:
            doc = users.find_one({'google_id': google_id})
            if doc and doc.get('cached_data'):
                cached_data = doc['cached_data']
                logger.info("💾 Sync crashed - returning cached data as fallback")
                return {
                    'success': True,
                    'sync_type': 'CACHED',
                    'subscriptions': cached_data.get('subscriptions', []),
                    'subscription_genres': cached_data.get('subscription_genres', []),
                    'saved_videos': cached_data.get('saved_videos', []),
                    'music_listened': cached_data.get('music_listened', []),
                    'video_genres': cached_data.get('video_genres', []),
                    'playlists': cached_data.get('playlists', []),
                    'last_synced_at': doc.get('last_full_sync'),
                    'message': '⚠️  Sync encountered an error. Returning cached data. Please try again later.',
                    'warning': 'syncError'
                }
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to sync YouTube data: {str(e)}")


@app.get("/compare/generate_link")
async def generate_comparison_link(google_id: str = Depends(verify_token)):
    """Generate a shareable comparison link for the authenticated user."""
    try:
        cached_data = get_cached_user_data(google_id, cache_validity_hours=24)

        if cached_data:
            user1_data = {
                'subscriptions': cached_data.get('subscriptions', []),
                'subscription_genres': cached_data.get('subscription_genres', []),
                'saved_videos': cached_data.get('saved_videos', []),
                'music_listened': cached_data.get('music_listened', []),
                'video_genres': cached_data.get('video_genres', []),
                'playlists': cached_data.get('playlists', []),
            }
        else:
            creds = get_credentials_from_db(google_id)
            if not creds:
                raise HTTPException(status_code=401, detail="Invalid or expired credentials")

            youtube = get_youtube_service(creds)

            loop = asyncio.get_event_loop()
            subscriptions, saved_data = await asyncio.gather(
                loop.run_in_executor(None, fetch_subscriptions, youtube),
                loop.run_in_executor(None, fetch_saved_videos, youtube),
                return_exceptions=True
            )

            if isinstance(subscriptions, Exception):
                subscriptions = []
            if isinstance(saved_data, Exception):
                saved_data = {'video_ids': [], 'saved_videos': []}

            channel_ids = [s['channel_id'] for s in subscriptions] if subscriptions else []
            subscription_genres = await loop.run_in_executor(None, fetch_subscription_genres, youtube, channel_ids)
            music_listened, video_genres = await loop.run_in_executor(None, determine_music_and_genres, youtube, saved_data.get('video_ids', []))
            playlists = await loop.run_in_executor(None, fetch_playlists, youtube)

            user1_data = {
                'subscriptions': subscriptions,
                'subscription_genres': subscription_genres,
                'saved_videos': saved_data.get('saved_videos', []),
                'music_listened': music_listened,
                'video_genres': video_genres,
                'playlists': playlists,
            }

        comparison_id = generate_secure_code()
        csrf_token = secrets.token_urlsafe(32)
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
        share_link = f"{frontend.rstrip('/')}/compare/join/{comparison_id}"

        comparisons.insert_one({
            '_id': comparison_id,
            'user1_id': google_id,
            'user1_data': user1_data,
            'csrf_token': csrf_token,
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(hours=2)
        })

        return {'link': share_link, 'comparison_id': comparison_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error generating comparison link")
        raise HTTPException(status_code=500, detail=f"Failed to generate link: {str(e)}")


@app.get("/compare/join/{comparison_id}")
async def join_comparison(comparison_id: str):
    """Redirect user to login when they click a comparison link."""
    comparison = comparisons.find_one({'_id': comparison_id})
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison link not found or expired")

    if comparison.get('expires_at') and comparison['expires_at'] < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Comparison link has expired (2 hour limit)")

    if comparison.get('status') == 'ready' or comparison.get('status') == 'completed':
        raise HTTPException(status_code=400, detail="This comparison is already complete")

    redirect_uri = build_redirect_uri()

    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "redirect_uris": [redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = redirect_uri

        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )

        auth_states.insert_one({
            "state": state,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=5),
            "comparison_id": comparison_id
        })

        return RedirectResponse(url=auth_url, status_code=302)
    except Exception as e:
        logger.exception("Failed to build OAuth flow for comparison join")
        raise HTTPException(status_code=500, detail=f"OAuth setup error: {str(e)}")


@app.get("/compare/invite/{comparison_id}")
async def comparison_invite(comparison_id: str):
    comparison = comparisons.find_one({'_id': comparison_id})
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison link not found or expired")
    if comparison.get('expires_at') and comparison['expires_at'] < _utcnow():
        raise HTTPException(status_code=410, detail="Comparison link has expired")
    if comparison.get('status') in ('ready', 'completed'):
        raise HTTPException(status_code=410, detail="This invitation has already been used")
    host = users.find_one({'google_id': comparison.get('user1_id')}, {'profile': 1}) or {}
    return {
        'comparison_id': comparison_id,
        'status': comparison.get('status', 'pending'),
        'expires_at': comparison.get('expires_at'),
        'host': host.get('profile', {}),
    }


@app.get("/compare/run/{comparison_id}")
async def get_comparison(comparison_id: str, refresh: bool = False, google_id: str = Depends(verify_token)):
    """Get comparison results. Run comparison if not already completed."""
    comparison = comparisons.find_one({'_id': comparison_id})
    if not comparison:
        raise HTTPException(status_code=404, detail="Comparison not found")

    if comparison.get('user1_id') != google_id and comparison.get('user2_id') != google_id:
        raise HTTPException(status_code=403, detail="You are not authorized to view this comparison")

    user1_id = comparison.get('user1_id')
    user2_id = comparison.get('user2_id')

    user1_cached, user1_last_synced, user1_source, user1_profile = get_user_cached_data_for_compare(user1_id)
    user2_cached, user2_last_synced, user2_source, user2_profile = get_user_cached_data_for_compare(user2_id)

    viewer_is_user1 = google_id == user1_id
    viewer = {
            'last_synced_at': user1_last_synced if viewer_is_user1 else user2_last_synced,
            'data_source': user1_source if viewer_is_user1 else user2_source,
            'profile': user1_profile if viewer_is_user1 else user2_profile,
            'data': user1_cached if viewer_is_user1 else user2_cached,
        }
    other = {
            'last_synced_at': user2_last_synced if viewer_is_user1 else user1_last_synced,
            'data_source': user2_source if viewer_is_user1 else user1_source,
            'profile': user2_profile if viewer_is_user1 else user1_profile,
            'data': user2_cached if viewer_is_user1 else user1_cached,
        }
    meta = {'viewer': viewer, 'other': other}
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip('/')
    envelope = {
        'status': comparison.get('status', 'pending'),
        'role': 'host' if viewer_is_user1 else 'guest',
        'invite_url': f"{frontend}/compare/join/{comparison_id}" if viewer_is_user1 else None,
        'expires_at': comparison.get('expires_at'),
        'participants': {'viewer': viewer, 'other': other},
        'meta': meta,
    }

    status = comparison.get('status')

    if status == 'completed' and comparison.get('results') and not refresh:
        return {**envelope, 'status': 'completed', 'results': comparison.get('results')}

    if status not in ['ready', 'completed']:
        return {**envelope,
            'status': status or 'pending',
            'message': 'Comparison is not ready. Both users must complete login.',
        }

    user1_data = user1_cached or comparison.get('user1_data')
    user2_data = user2_cached or comparison.get('user2_data')

    if not user1_data or not user2_data:
        raise HTTPException(status_code=400, detail="Missing user data for comparison")

    try:
        results = compare_interests_logic(user1_data, user2_data)

        comparisons.update_one(
            {'_id': comparison_id},
            {
                '$set': {
                    'status': 'completed',
                    'results': results,
                    'updated_at': datetime.utcnow()
                }
            }
        )

        return {**envelope, 'status': 'completed', 'results': results}
    except Exception as e:
        logger.exception("Error running comparison")
        raise HTTPException(status_code=500, detail=f"Failed to run comparison: {str(e)}")


@app.post("/compare/run/{comparison_id}")
async def run_comparison(comparison_id: str, google_id: str = Depends(verify_token)):
    """Run the comparison between two users and return results (POST for backwards compatibility)."""
    return await get_comparison(comparison_id, refresh=False, google_id=google_id)


@app.get("/auth/complete")
async def auth_complete_fallback(code: str = None, next: str = None):
        """Temporary backend fallback for `/auth/complete` when frontend route is missing.
        Enable by setting `ENABLE_FALLBACK=true` in the environment. This endpoint redeems
        the one-time `code` and returns a small HTML page that stores the JWT in
        `localStorage` and redirects to the dashboard or `next` path.
        """
        if os.getenv('ENABLE_FALLBACK', 'false').lower() != 'true':
                raise HTTPException(status_code=404, detail='Not Found')

        if not code:
                raise HTTPException(status_code=400, detail='Missing code')

        code_doc = auth_codes.find_one_and_delete({
                'code': code,
                'expires_at': {'$gt': datetime.utcnow()}
        })
        if not code_doc:
                raise HTTPException(status_code=400, detail='Invalid or expired code')

        google_id = code_doc.get('google_id')
        jwt_secret = os.getenv('JWT_SECRET')
        if not jwt_secret:
                raise HTTPException(status_code=500, detail='JWT_SECRET not configured')

        token = pyjwt.encode({
                'sub': google_id,
                'exp': datetime.utcnow() + timedelta(minutes=30)
        }, jwt_secret, algorithm='HS256')

        redirect_target = validate_redirect_target(next)

        tokens_json = json.dumps({'access_token': token})
        frontend = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        frontend_safe = frontend.rstrip('/')

        html = f"""
        <!doctype html>
        <html>
            <head><meta charset='utf-8'><title>Completing login</title></head>
            <body>
                <script>
                    try {{
                        const tokens = {tokens_json};
                        localStorage.setItem('access_token', tokens.access_token);
                    }} catch(e){{}}
                    window.location = {json.dumps(frontend_safe + redirect_target)};
                </script>
                <p>Completing login...</p>
            </body>
        </html>
        """
        return HTMLResponse(content=html, status_code=200)
