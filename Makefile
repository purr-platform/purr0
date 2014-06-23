bin        = $(shell npm bin)
sjs        = $(bin)/sjs
browserify = $(bin)/browserify
jsdoc      = $(bin)/jsdoc
uglify     = $(bin)/uglifyjs
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')

# -- Configuration -----------------------------------------------------
PACKGE   = NAME
EXPORTS  = EXPORTS

LIB_DIR  = lib
SRC_DIR  = src
SRC      = $(wildcard $(SRC_DIR)/*.sjs)
TGT      = ${SRC:$(SRC_DIR)/%.sjs=$(LIB_DIR)/%.js}

TEST_DIR = test/specs-src
TEST_BLD = test/specs
TEST_SRC = $(wildcard $(TEST_DIR)/*.sjs)
TEST_TGT = ${TEST_SRC:$(TEST_DIR)/%.sjs=$(TEST_BLD)/%.js}


# -- Compilation -------------------------------------------------------
dist:
	mkdir -p $@

dist/$(PACKAGE).umd.js: $(LIB_DIR)/index.js dist
	$(browserify) $< --standalone $(EXPORTS) > $@

dist/$(PACKAGE).umd.min.js: dist/$(PACKAGE).umd.js
	$(uglify) --mangle - < $< > $@

$(LIB_DIR)/%.js: $(SRC_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names \
	       --sourcemap      \
	       --output $@      \
	       $<

$(TEST_BLD)/%.js: $(TEST_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names        \
	       --module alright/macros \
	       --output $@             \
	       $<


# -- Tasks -------------------------------------------------------------
all: $(TGT)

bundle: dist/$(PACKAGE).umd.js

minify: dist/$(PACKAGE).umd.min.js

documentation:
	$(jsdoc) --configure jsdoc.conf.json
	ABSPATH=$(shell cd "$(dirname "$0")"; pwd) $(MAKE) clean-docs

clean-docs:
	perl -pi -e "s?$$ABSPATH/??g" ./docs/*.html

clean:
	rm -rf dist build

test: $(TEST_TGT)
	node test/tap

package: documentation bundle minify
	mkdir -p dist/$(PACKAGE)-$(VERSION)
	cp -r docs dist/$(PACKAGE)-$(VERSION)
	cp -r lib dist/$(PACKAGE)-$(VERSION)
	cp dist/*.js dist/$(PACKAGE)-$(VERSION)
	cp package.json dist/$(PACKAGE)-$(VERSION)
	cp README.md dist/$(PACKAGE)-$(VERSION)
	cp LICENCE dist/$(PACKAGE)-$(VERSION)
	cd dist && tar -czf $(PACKAGE)-$(VERSION).tar.gz $(PACKAGE)-$(VERSION)

publish: clean
	npm install
	npm publish

bump:
	node tools/bump-version.js $$VERSION_BUMP

bump-feature:
	VERSION_BUMP=FEATURE $(MAKE) bump

bump-major:
	VERSION_BUMP=MAJOR $(MAKE) bump

.PHONY: test bump bump-feature bump-major publish package clean documentation
