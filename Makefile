WASI_SDK_PATH ?= ./toolchain/wasi-sdk-24.0
CC = $(WASI_SDK_PATH)/bin/clang
SYSROOT = $(WASI_SDK_PATH)/share/wasi-sysroot
CFLAGS = -O3 -flto -g0 -mexec-model=reactor -Wall -Wextra --sysroot=$(SYSROOT) -DNO_SWE_GLP
LDFLAGS = -Wl,--export-all -Wl,--no-entry -Wl,--allow-undefined

SRCDIR = vendor/swisseph
SOURCES = $(SRCDIR)/swedate.c $(SRCDIR)/swehouse.c $(SRCDIR)/swejpl.c \
          $(SRCDIR)/swemmoon.c $(SRCDIR)/swemplan.c $(SRCDIR)/sweph.c \
          $(SRCDIR)/swephlib.c $(SRCDIR)/swecl.c $(SRCDIR)/swehel.c

TARGET = lib/wasi/swiss_eph.wasm
NATIVE_DYLIB = lib/native/libswisseph.dylib

all: $(TARGET)

CC_NATIVE ?= cc
$(TARGET): $(SOURCES)
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $^

# Native shared library for FFI benchmarking
$(NATIVE_DYLIB): $(SOURCES)
	@mkdir -p $(dir $@)
	$(CC_NATIVE) -O3 -shared -fPIC -o $@ $^ -I$(SRCDIR) -lm -DNO_SWE_GLP

native: $(NATIVE_DYLIB)

swetest_enhanced: scripts/swetest_enhanced.c $(SOURCES)
	$(CC_NATIVE) -O3 -o $@ $^ -I$(SRCDIR) -lm -DNO_SWE_GLP

# Native C benchmark binary (runs iterations internally with timing)
bench_native: scripts/bench_native.c $(SOURCES)
	$(CC_NATIVE) -O3 -o $@ $^ -I$(SRCDIR) -lm -DNO_SWE_GLP

swetest_enhanced.wasm: scripts/swetest_enhanced.c $(SOURCES)
	$(CC) -O3 -flto -g0 -Wall -Wextra --sysroot=$(SYSROOT) -DNO_SWE_GLP -Wl,--export-all -o $@ $^ -I$(SRCDIR) -lm -DNO_SWE_GLP


strip: $(TARGET)
	$(WASI_SDK_PATH)/bin/llvm-strip $(TARGET)

clean:
	rm -f $(TARGET) $(NATIVE_DYLIB) swetest_enhanced swetest_enhanced.wasm bench_native
