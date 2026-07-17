PACKAGES := ah-js-endpoints ah-js-utils ah-ff-react
VERSIONS_FILE := versions.yml

.DEFAULT_GOAL := help

ifneq ($(filter publish,$(MAKECMDGOALS)),)
REQUESTED_PACKAGE := $(filter-out publish,$(MAKECMDGOALS))

ifneq ($(words $(REQUESTED_PACKAGE)),1)
$(error Usage: make publish <package>. Run "make help" for available packages)
endif

ifeq ($(filter $(REQUESTED_PACKAGE),$(PACKAGES)),)
$(error Unknown package "$(REQUESTED_PACKAGE)". Run "make help" for available packages)
endif
endif

.PHONY: help publish $(PACKAGES)

help:
	@printf '%s\n' \
		'Publish an npm package from the NPMS directory.' \
		'' \
		'Usage:' \
		'  make publish <package>' \
		'  make help' \
		'' \
		'Available packages:' \
		'  ah-js-endpoints' \
		'  ah-js-utils' \
		'  ah-ff-react' \
		'' \
		'Examples:' \
		'  make publish ah-js-endpoints' \
		'  make publish ah-js-utils' \
		'  make publish ah-ff-react' \
		'' \
		'Set package versions in $(VERSIONS_FILE) before publishing.' \
		'Publishing updates package.json and package-lock.json, then runs npm publish.' \
		'The package prepublishOnly script builds it before publication.'

publish:
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
