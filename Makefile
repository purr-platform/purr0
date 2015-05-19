bin        = $(shell npm bin)
sjs        = $(bin)/sjs
browserify = $(bin)/browserify
jsdoc      = $(bin)/jsdoc
uglify     = $(bin)/uglifyjs
ometa      = $(bin)/ometajs2js
VERSION    = $(shell node -e 'console.log(require("./package.json").version)')

# -- Configuration -----------------------------------------------------
LIB_DIR  = lib
SRC_DIR  = src
SRC      = $(wildcard $(SRC_DIR)/*.sjs $(SRC_DIR)/*.ometajs)
TGT      = ${SRC:$(SRC_DIR)/%.sjs=$(LIB_DIR)/%.js} ${SRC:$(SRC_DIR)/%.ometajs=$(LIB_DIR)/%.js}

TEST_DIR = test/specs-src
TEST_BLD = test/specs
TEST_SRC = $(wildcard $(TEST_DIR)/*.sjs)
TEST_TGT = ${TEST_SRC:$(TEST_DIR)/%.sjs=$(TEST_BLD)/%.js}


# -- Compilation -------------------------------------------------------
$(LIB_DIR)/%.js: $(SRC_DIR)/%.ometajs
	mkdir -p $(dir $@)
	$(ometa) --beautify < $< > $@

$(LIB_DIR)/%.js: $(SRC_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names \
	       --sourcemap \
	       --module lambda-chop/macros \
	       --module adt-simple/macros \
	       --module sparkler/macros \
	       --module es6-macros/macros/destructure \
	       --module macros.operators \
	       --output $@ \
	       $<

$(TEST_BLD)/%.js: $(TEST_DIR)/%.sjs
	mkdir -p $(dir $@)
	$(sjs) --readable-names        \
	       --module alright/macros \
	       --output $@             \
	       $<


# -- Tasks -------------------------------------------------------------
all: $(TGT)

documentation: $(TGT)
	$(jsdoc) --configure jsdoc.conf.json
	ABSPATH=$(shell cd "$(dirname "$0")"; pwd) $(MAKE) clean-docs

clean-docs:
	perl -pi -e "s?$$ABSPATH/??g" ./docs/*.html

clean:
	rm -rf dist build $(LIB_DIR) $(TEST_BLD)

test: all $(TEST_TGT)
	node test/tap

publish: clean
	rm -rf node_modules
	npm install
	$(MAKE) test
	npm publish

bump:
	node tools/bump-version.js $$VERSION_BUMP

bump-feature:
	VERSION_BUMP=FEATURE $(MAKE) bump

bump-major:
	VERSION_BUMP=MAJOR $(MAKE) bump

.PHONY: test bump bump-feature bump-major publish clean documentation
