HOMEDIR = $(shell pwd)
GITDIR = /var/repos/trenchant-insight.git
PM2 = $(HOMEDIR)/node_modules/pm2/bin/pm2

test:
	node tests/basictests.js

start: start-trenchant-insight
	$(PM2) start trenchant-insight.js --name trenchant-insight

stop:
	$(PM2) stop trenchant-insight || echo "Didn't need to stop process."

list:
	$(PM2) list

sync-worktree-to-git:
	git --work-tree=$(HOMEDIR) --git-dir=$(GITDIR) checkout -f

npm-install:
	cd $(HOMEDIR)
	npm install
	npm prune

post-receive: sync-worktree-to-git npm-install stop start
