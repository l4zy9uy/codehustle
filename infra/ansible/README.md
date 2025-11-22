# Ansible Provisioning

Use this playbook to turn fresh DigitalOcean Droplets into CodeHustle deployment targets. It installs Docker/Compose, creates a non-root deploy user, clones this repository, and (optionally) writes the backend `.env`.

## Prerequisites

- Ansible 2.13+ on your control machine.
- SSH access to the target hosts (`root` works on fresh VMs; the playbook will create the non-root deploy user).
- Secrets ready to populate `backend/.env` (store them via vaulted vars or pass them at runtime).

## Quick Start

1. Copy the sample inventory and edit it with your host IPs and settings:
   ```bash
   cp infra/ansible/inventory.example infra/ansible/inventory.prod
   ```
2. Update `inventory.prod` with:
   - Hostnames + IPs
   - `ansible_user` (SSH user)
   - `deploy_user`, `deploy_repo_path`, `deploy_repo_branch`
3. (Optional) Create a vaulted vars file or pass `-e backend_env_content="$(cat backend/.env)"` so Ansible can drop the `.env` during provisioning.
4. Run the playbook:
   ```bash
   ansible-playbook -i infra/ansible/inventory.prod infra/ansible/playbook.yml
   ```

When it finishes every host will have Docker + Compose ready, the `deploy_user` in the `docker` group, and a clone of this repo at `deploy_repo_path`. From there the GitHub Actions `Manual Deploy` workflow can pull/push images and run `backend/deploy.sh` remotely without further manual setup.
