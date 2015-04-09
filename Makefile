HOMEDIR = $(shell pwd)
GITDIR = /var/repos/trenchant-insights.git
PM2 = pm2
CACHESERVER = node_modules/.bin/level-cache-server

test:
	node tests/basictests.js

start: start-trenchant-insights
	$(PM2) start trenchant-insights.js --name trenchant-insights

stop:
	$(PM2) stop trenchant-insights || echo "Didn't need to stop process."

start-cache:
	$(PM2) start -f $(CACHESERVER) --name conceptnet-cache -- \
	--port 5678 --dbPath conceptnet-cache.db || \
	echo "conceptnet-cache has already been started."

stop-cache:
	$(PM2) stop conceptnet-cache || echo "Didn't need to stop process."

list:
	$(PM2) list

sync-worktree-to-git:
	git --work-tree=$(HOMEDIR) --git-dir=$(GITDIR) checkout -f

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

post-receive: sync-worktree-to-git npm-install stop start
