bin    := $(shell npm bin)
doctoc := $(bin)/doctoc

# -- CONFIGURATION -----------------------------------------------------
DOC_DIR := docs/notes

# -- TASKS -------------------------------------------------------------
help:
	@echo ""
	@echo "Tasks:"
	@echo	"  docs-toc		Generate table of contents for markdown notes"
	@echo ""

docs-toc: $(DOC_DIR)/*.md
	$(doctoc) $(DOC_DIR)

.PHONY: docs-toc
