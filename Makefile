WASI_SDK_PATH ?= ./toolchain/wasi-sdk-24.0
CC = $(WASI_SDK_PATH)/bin/clang
SYSROOT = $(WASI_SDK_PATH)/share/wasi-sysroot
CFLAGS = -O3 -flto -g0 -mexec-model=reactor -Wall -Wextra --sysroot=$(SYSROOT) -DNO_SWE_GLP
LDFLAGS = -Wl,--export-all -Wl,--no-entry -Wl,--allow-undefined

SRCDIR = src/swisseph
SOURCES = $(SRCDIR)/swedate.c $(SRCDIR)/swehouse.c $(SRCDIR)/swejpl.c \
          $(SRCDIR)/swemmoon.c $(SRCDIR)/swemplan.c $(SRCDIR)/sweph.c \
          $(SRCDIR)/swephlib.c $(SRCDIR)/swecl.c $(SRCDIR)/swehel.c

TARGET = libswephe.wasm

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^


strip: $(TARGET)
	$(WASI_SDK_PATH)/bin/llvm-strip $(TARGET)

