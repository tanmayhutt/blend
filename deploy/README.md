# Ubuntu deployment

Project directory: `/home/ubuntu/tanmay/blend` on `ubuntu@15.206.247.203`.

The Docker image builds Vite and serves it alongside the FastAPI backend via `deploy/server.py`. Caddy terminates HTTPS and forwards requests to loopback port 5060. MongoDB Atlas and Google remain external services.

Provision `.env.production` in the project directory with the existing production credentials and mode 600. Never include it in the image or Git. Compose sets the production runtime flags and environment variables.

Run `docker compose up -d --build` from the project directory. Inspect `docker compose ps` and `curl -f http://127.0.0.1:5060/api/health` before changing DNS.

Append `deploy/Caddyfile.blend` to the host Caddy configuration only after backing up and validating it. Preserve existing host sites. Point `blend.tanmaytiwari.me` to `15.206.247.203`. Caddy provisions HTTPS after DNS points here.

The domain and Google client ID remain unchanged. Google login requires HTTPS and must be verified after the DNS switch.

Pushes to `main` run the **Deploy to Ubuntu** GitHub Actions workflow. It uses `BLEND_DEPLOY_KEY` and `BLEND_KNOWN_HOSTS` repository secrets. The SSH key is restricted to `/usr/local/bin/blend-deploy`, which invokes the root-owned `/usr/local/lib/blend/deploy.sh`. These are installed copies of the scripts in this folder; changes to them require installation on the host.

Deployments are serialized, require a clean server checkout, fast-forward to the current main commit, build before replacing the running container, and wait for container health. Failed startup attempts restore the previous image. This is a single-container deployment, so a short interruption can occur during replacement. The workflow also checks public HTTPS health. Application credentials remain in the server's `.env.production` file.
