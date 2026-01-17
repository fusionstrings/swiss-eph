WASI_SDK_PATH ?= ./toolchain/wasi-sdk-24.0
CC = $(WASI_SDK_PATH)/bin/clang
SYSROOT = $(WASI_SDK_PATH)/share/wasi-sysroot
CFLAGS = -O3 -flto -g0 -mexec-model=reactor -Wall -Wextra --sysroot=$(SYSROOT) -DNO_SWE_GLP
LDFLAGS = -Wl,--export-all -Wl,--no-entry -Wl,--allow-undefined

SRCDIR = vendor/swisseph
SOURCES = $(SRCDIR)/swedate.c $(SRCDIR)/swehouse.c $(SRCDIR)/swejpl.c \
          $(SRCDIR)/swemmoon.c $(SRCDIR)/swemplan.c $(SRCDIR)/sweph.c \
          $(SRCDIR)/swephlib.c $(SRCDIR)/swecl.c $(SRCDIR)/swehel.c

TARGET = generated/libswephe.wasm

all: $(TARGET)

CC_NATIVE ?= cc
$(TARGET): $(SOURCES)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

swetest_enhanced: scripts/swetest_enhanced.c $(SOURCES)
	$(CC_NATIVE) -O3 -o $@ $^ -I$(SRCDIR) -lm -DNO_SWE_GLP

swetest_enhanced.wasm: scripts/swetest_enhanced.c $(SOURCES)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^ -I$(SRCDIR) -lm -DNO_SWE_GLP


strip: $(TARGET)
	$(WASI_SDK_PATH)/bin/llvm-strip $(TARGET)

