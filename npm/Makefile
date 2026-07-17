PACKAGES := ah-js-endpoints ah-js-utils ah-ff-react
VERSIONS_FILE := versions.yml

.DEFAULT_GOAL := help

REQUESTED_COMMAND := $(filter test publish,$(MAKECMDGOALS))

ifneq ($(REQUESTED_COMMAND),)
ifneq ($(words $(REQUESTED_COMMAND)),1)
$(error Run one command at a time: make test <package> or make publish <package>)
endif

REQUESTED_PACKAGE := $(filter-out $(REQUESTED_COMMAND),$(MAKECMDGOALS))

ifneq ($(words $(REQUESTED_PACKAGE)),1)
$(error Usage: make $(REQUESTED_COMMAND) <package>. Run "make help" for available packages)
endif

ifeq ($(filter $(REQUESTED_PACKAGE),$(PACKAGES)),)
$(error Unknown package "$(REQUESTED_PACKAGE)". Run "make help" for available packages)
endif
endif

.PHONY: help test publish $(PACKAGES)

help:
	@printf '%s\n' \
		'Test or publish an npm package from the npm directory.' \
		'' \
		'Usage:' \
		'  make test <package>' \
		'  make publish <package>' \
		'  make help' \
		'' \
		'Available packages:' \
		'  ah-js-endpoints' \
		'  ah-js-utils' \
		'  ah-ff-react' \
		'' \
		'Examples:' \
		'  make test ah-js-endpoints' \
		'  make publish ah-js-endpoints' \
		'  make publish ah-js-utils' \
		'  make publish ah-ff-react' \
		'' \
		'Set package versions in $(VERSIONS_FILE) before publishing.' \
		'Publishing runs tests, updates package.json and package-lock.json, then runs npm publish.' \
		'The package prepublishOnly script builds it before publication.'

test:
	@echo "Testing $(REQUESTED_PACKAGE)..."
	@cd "$(REQUESTED_PACKAGE)" && npm test

publish: test
	@version="$$(awk -F ': *' '$$1 == "$(REQUESTED_PACKAGE)" { print $$2 }' "$(VERSIONS_FILE)")"; \
	if [ -z "$$version" ]; then \
		echo "No version configured for $(REQUESTED_PACKAGE) in $(VERSIONS_FILE)."; \
		exit 1; \
	fi; \
	echo "Setting $(REQUESTED_PACKAGE) version to $$version..."; \
	cd "$(REQUESTED_PACKAGE)" && \
		npm version "$$version" --no-git-tag-version --allow-same-version && \
		npm publish --access public

$(PACKAGES):
	@:
