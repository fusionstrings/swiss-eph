
#include <stddef.h>
#include <stdint.h>

// Dummy FILE structure
typedef struct FILE FILE;

// I/O Stubs
int sprintf(char *str, const char *format, ...) { return 0; }
char *fgets(char *s, int size, FILE *stream) { return NULL; }
int fclose(FILE *stream) { return 0; }
size_t fread(void *ptr, size_t size, size_t nmemb, FILE *stream) { return 0; }
void rewind(FILE *stream) { }
int fseeko(FILE *stream, int64_t offset, int whence) { return -1; }
int64_t ftello(FILE *stream) { return -1; }
FILE *fopen(const char *filename, const char *mode) { return NULL; }
int fseek(FILE *stream, long offset, int whence) { return -1; }
long ftell(FILE *stream) { return -1; }

// Environment
char *getenv(const char *name) { return NULL; }

// Memory (calloc needed, malloc/free provided by lib.rs or stubs if needed, 
// but lib.rs exports "malloc"/"free", here we likely need calloc to use that or just minimal)
// Since we are linking static, if we define calloc here, it might conflict if libc was present.
// But we assume no libc.
void *malloc(size_t size);
void *memset(void *s, int c, size_t n);

void *calloc(size_t nmemb, size_t size) {
    size_t total = nmemb * size;
    void *p = malloc(total);
    if (p) memset(p, 0, total);
    return p;
}

// String/Math Stubs (Some might be needed for functionality. 
// Ideally we should use a minimal implementations, but for "no file access" mode,
// maybe typical heavy usage is avoided.
// However, Swiss Eph Moshier calculations MIGHT use these.
// Let's implement simple versions of vital ones.)

int atoi(const char *nptr) {
    int res = 0;
    int sign = 1;
    if (*nptr == '-') { sign = -1; nptr++; }
    while (*nptr >= '0' && *nptr <= '9') {
        res = res * 10 + (*nptr - '0');
        nptr++;
    }
    return sign * res;
}

long atol(const char *nptr) {
    return (long)atoi(nptr);
}

double atof(const char *nptr) {
    // Very minimal atof, ignores scientific notation for now if not critical
    // or use a better one if needed. Moshier mode might need it?
    // Actually, swisseph has its own parsing often.
    // Let's hope basic parsing is enough.
    double res = 0.0;
    int sign = 1;
    if (*nptr == '-') { sign = -1; nptr++; }
    while (*nptr >= '0' && *nptr <= '9') {
        res = res * 10.0 + (*nptr - '0');
        nptr++;
    }
    if (*nptr == '.') {
        double frac = 0.1;
        nptr++;
        while (*nptr >= '0' && *nptr <= '9') {
            res += (*nptr - '0') * frac;
            frac *= 0.1;
            nptr++;
        }
    }
    return sign * res;
}

char *strcpy(char *dest, const char *src) {
    char *d = dest;
    while ((*d++ = *src++));
    return dest;
}

char *strncpy(char *dest, const char *src, size_t n) {
    char *d = dest;
    while (n > 0 && *src) {
        *d++ = *src++;
        n--;
    }
    while (n > 0) {
        *d++ = 0;
        n--;
    }
    return dest;
}

char *strcat(char *dest, const char *src) {
    char *d = dest;
    while (*d) d++;
    while ((*d++ = *src++));
    return dest;
}

int strcmp(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++; s2++;
    }
    return *(const unsigned char*)s1 - *(const unsigned char*)s2;
}

int strncmp(const char *s1, const char *s2, size_t n) {
    while (n > 0 && *s1 && (*s1 == *s2)) {
        s1++; s2++;
        n--;
    }
    if (n == 0) return 0;
    return *(const unsigned char*)s1 - *(const unsigned char*)s2;
}

size_t strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return p - s;
}

char *strdup(const char *s) {
    size_t len = strlen(s) + 1;
    void *new = malloc(len);
    if (new) strcpy(new, s);
    return new;
}

char *strchr(const char *s, int c) {
    while (*s != (char)c) {
        if (!*s++) return NULL;
    }
    return (char *)s;
}

char *strrchr(const char *s, int c) {
    char *last = NULL;
    do {
        if (*s == (char)c) last = (char *)s;
    } while (*s++);
    return last;
}

char *strstr(const char *haystack, const char *needle) {
    if (!*needle) return (char *)haystack;
    for (; *haystack; haystack++) {
        if (*haystack == *needle) {
            const char *h = haystack, *n = needle;
            while (*h && *n && *h == *n) {
                h++; n++;
            }
            if (!*n) return (char *)haystack;
        }
    }
    return NULL;
}

char *strpbrk(const char *s, const char *accept) {
    while (*s) {
        if (strchr(accept, *s)) return (char *)s;
        s++;
    }
    return NULL;
}

void *memchr(const void *s, int c, size_t n) {
    const unsigned char *p = s;
    while (n-- > 0) {
        if (*p == (unsigned char)c) return (void *)p;
        p++;
    }
    return NULL;
}

int tolower(int c) {
    if (c >= 'A' && c <= 'Z') return c + ('a' - 'A');
    return c;
}

int toupper(int c) {
    if (c >= 'a' && c <= 'z') return c - ('a' - 'A');
    return c;
}

int abs(int j) {
    return (j < 0) ? -j : j;
}

void *memset(void *s, int c, size_t n) {
    unsigned char *p = s;
    while (n-- > 0) *p++ = (unsigned char)c;
    return s;
}
