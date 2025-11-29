import re
import subprocess
import sys
import os

def bump_version():
    sw_path = 'service-worker.js'
    
    if not os.path.exists(sw_path):
        print(f"Error: {sw_path} not found!")
        return False

    with open(sw_path, 'r') as f:
        content = f.read()

    # Look for 'mess-menu-vX'
    pattern = r"(const CACHE_NAME = ['\"]mess-menu-v)(\d+)(['\"])"
    match = re.search(pattern, content)

    if not match:
        print("Error: Could not find CACHE_NAME version pattern in service-worker.js")
        return False

    current_version = int(match.group(2))
    new_version = current_version + 1
    new_content = re.sub(pattern, f"\\g<1>{new_version}\\g<3>", content)

    with open(sw_path, 'w') as f:
        f.write(new_content)
    
    print(f"✅ Bumped Service Worker version: v{current_version} -> v{new_version}")
    return True

def git_push(message):
    try:
        print("📦 Adding files...")
        subprocess.run(["git", "add", "."], check=True)
        
        print(f"💾 Committing: '{message}'")
        subprocess.run(["git", "commit", "-m", message], check=True)
        
        print("🚀 Pushing to remote...")
        subprocess.run(["git", "push"], check=True)
        
        print("\n✨ Deployment Complete! Users will see the update notification shortly.")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Git command failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy.py \"Your commit message\"")
        sys.exit(1)
    
    commit_message = sys.argv[1]
    
    if bump_version():
        git_push(commit_message)
