/**
 * Swiss Ephemeris Native C Benchmark
 * 
 * Runs in-process benchmarks with internal timing for fair comparison
 * against WASM/WASI builds.
 * 
 * Compile: make bench_native
 * Run: ./bench_native [iterations]
 */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "swephexp.h"

#define DEFAULT_ITERATIONS 10000
#define TEST_JD 2460323.5  /* 2024-01-14 */

double get_time_ms() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return ts.tv_sec * 1000.0 + ts.tv_nsec / 1000000.0;
}

int main(int argc, char *argv[]) {
    int iterations = DEFAULT_ITERATIONS;
    double xx[6];
    char serr[256];
    int iflag, i;
    double start, end, duration;
    
    if (argc > 1) {
        iterations = atoi(argv[1]);
        if (iterations <= 0) iterations = DEFAULT_ITERATIONS;
    }
    
    /* Set ephemeris path */
    swe_set_ephe_path("./vendor/swisseph/ephe");
    
    /* Standard flags */
    iflag = SEFLG_SWIEPH | SEFLG_SPEED;
    
    printf("Swiss Ephemeris Native C Benchmark\n");
    printf("===================================\n");
    printf("Iterations: %d\n", iterations);
    printf("Operations per iteration: 2 (Sun + Moon)\n");
    printf("Total operations: %d\n\n", iterations * 2);
    
    /* Warm-up run */
    for (i = 0; i < 100; i++) {
        swe_calc(TEST_JD + i / 1000.0, SE_SUN, iflag, xx, serr);
        swe_calc(TEST_JD + i / 1000.0, SE_MOON, iflag, xx, serr);
    }
    
    /* Timed benchmark */
    start = get_time_ms();
    
    for (i = 0; i < iterations; i++) {
        double jd = TEST_JD + i / 1000.0;
        swe_calc(jd, SE_SUN, iflag, xx, serr);
        swe_calc(jd, SE_MOON, iflag, xx, serr);
    }
    
    end = get_time_ms();
    duration = end - start;
    
    double ops_per_sec = (iterations * 2) / (duration / 1000.0);
    
    printf("Results:\n");
    printf("  Duration: %.2f ms\n", duration);
    printf("  Throughput: %.0f ops/sec\n", ops_per_sec);
    
    /* Output in machine-readable format for integration */
    printf("\n# BENCHMARK_RESULT\n");
    printf("name=Native C (in-process)\n");
    printf("duration_ms=%.2f\n", duration);
    printf("ops_per_sec=%.0f\n", ops_per_sec);
    printf("iterations=%d\n", iterations);
    
    swe_close();
    return 0;
}
