/**
 * Dummy WASI snapshot preview 1 shim to satisfy Deno's type checker
 * when it analyzes WASM binaries that import from wasi_snapshot_preview1.
 */

// Define types to make it look realistic if needed, though any[] is fine for dummy
type i32 = number;
type i64 = bigint;

export function args_get(_argv: i32, _argv_buf: i32): i32 {
  return 0;
}
export function args_sizes_get(_argc: i32, _argv_buf_size: i32): i32 {
  return 0;
}
export function environ_get(_environ: i32, _environ_buf: i32): i32 {
  return 0;
}
export function environ_sizes_get(
  _environ_count: i32,
  _environ_buf_size: i32,
): i32 {
  return 0;
}
export function clock_res_get(_id: i32, _resolution: i32): i32 {
  return 0;
}
export function clock_time_get(_id: i32, _precision: i64, _time: i32): i32 {
  return 0;
}
export function fd_advise(
  _fd: i32,
  _offset: i64,
  _len: i64,
  _advice: i32,
): i32 {
  return 0;
}
export function fd_allocate(_fd: i32, _offset: i64, _len: i64): i32 {
  return 0;
}
export function fd_close(_fd: i32): i32 {
  return 0;
}
export function fd_datasync(_fd: i32): i32 {
  return 0;
}
export function fd_fdstat_get(_fd: i32, _buf: i32): i32 {
  return 0;
}
export function fd_fdstat_set_flags(_fd: i32, _flags: i32): i32 {
  return 0;
}
export function fd_fdstat_set_rights(
  _fd: i32,
  _fs_rights_base: i64,
  _fs_rights_inheriting: i64,
): i32 {
  return 0;
}
export function fd_filestat_get(_fd: i32, _buf: i32): i32 {
  return 0;
}
export function fd_filestat_set_size(_fd: i32, _size: i64): i32 {
  return 0;
}
export function fd_filestat_set_times(
  _fd: i32,
  _atim: i64,
  _mtim: i64,
  _fst_flags: i32,
): i32 {
  return 0;
}
export function fd_pread(
  _fd: i32,
  _iovs: i32,
  _iovs_len: i32,
  _offset: i64,
  _nread: i32,
): i32 {
  return 0;
}
export function fd_prestat_get(_fd: i32, _buf: i32): i32 {
  return 0;
}
export function fd_prestat_dir_name(_fd: i32, _path: i32, _path_len: i32): i32 {
  return 0;
}
export function fd_pwrite(
  _fd: i32,
  _iovs: i32,
  _iovs_len: i32,
  _offset: i64,
  _nwritten: i32,
): i32 {
  return 0;
}
export function fd_read(
  _fd: i32,
  _iovs: i32,
  _iovs_len: i32,
  _nread: i32,
): i32 {
  return 0;
}
export function fd_readdir(
  _fd: i32,
  _buf: i32,
  _buf_len: i32,
  _cookie: i64,
  _bufused: i32,
): i32 {
  return 0;
}
export function fd_renumber(_fd: i32, _to: i32): i32 {
  return 0;
}
export function fd_seek(
  _fd: i32,
  _offset: i64,
  _whence: i32,
  _newoffset: i32,
): i32 {
  return 0;
}
export function fd_sync(_fd: i32): i32 {
  return 0;
}
export function fd_tell(_fd: i32, _newoffset: i32): i32 {
  return 0;
}
export function fd_write(
  _fd: i32,
  _iovs: i32,
  _iovs_len: i32,
  _nwritten: i32,
): i32 {
  return 0;
}
export function path_create_directory(
  _fd: i32,
  _path: i32,
  _path_len: i32,
): i32 {
  return 0;
}
export function path_filestat_get(
  _fd: i32,
  _flags: i32,
  _path: i32,
  _path_len: i32,
  _buf: i32,
): i32 {
  return 0;
}
export function path_filestat_set_times(
  _fd: i32,
  _flags: i32,
  _path: i32,
  _path_len: i32,
  _atim: i64,
  _mtim: i64,
  _fst_flags: i32,
): i32 {
  return 0;
}
export function path_link(
  _old_fd: i32,
  _old_flags: i32,
  _old_path: i32,
  _old_path_len: i32,
  _new_fd: i32,
  _new_path: i32,
  _new_path_len: i32,
): i32 {
  return 0;
}
export function path_open(
  _fd: i32,
  _dirflags: i32,
  _path: i32,
  _path_len: i32,
  _oflags: i32,
  _fs_rights_base: i64,
  _fs_rights_inheriting: i64,
  _fdflags: i32,
  _opened_fd: i32,
): i32 {
  return 0;
}
export function path_readlink(
  _fd: i32,
  _path: i32,
  _path_len: i32,
  _buf: i32,
  _buf_len: i32,
  _bufused: i32,
): i32 {
  return 0;
}
export function path_remove_directory(
  _fd: i32,
  _path: i32,
  _path_len: i32,
): i32 {
  return 0;
}
export function path_rename(
  _fd: i32,
  _old_path: i32,
  _old_path_len: i32,
  _new_fd: i32,
  _new_path: i32,
  _new_path_len: i32,
): i32 {
  return 0;
}
export function path_symlink(
  _old_path: i32,
  _old_path_len: i32,
  _fd: i32,
  _new_path: i32,
  _new_path_len: i32,
): i32 {
  return 0;
}
export function path_unlink_file(_fd: i32, _path: i32, _path_len: i32): i32 {
  return 0;
}
export function poll_oneoff(
  _in: i32,
  _out: i32,
  _nsubscriptions: i32,
  _nevents: i32,
): i32 {
  return 0;
}
export function proc_exit(_rval: i32): void {}
export function proc_raise(_sig: i32): i32 {
  return 0;
}
export function sched_yield(): i32 {
  return 0;
}
export function random_get(_buf: i32, _buf_len: i32): i32 {
  return 0;
}
export function sock_recv(
  _fd: i32,
  _ri_data: i32,
  _ri_data_len: i32,
  _ri_flags: i32,
  _ro_datalen: i32,
  _ro_flags: i32,
): i32 {
  return 0;
}
export function sock_send(
  _fd: i32,
  _si_data: i32,
  _si_data_len: i32,
  _si_flags: i32,
  _so_datalen: i32,
): i32 {
  return 0;
}
export function sock_shutdown(_fd: i32, _how: i32): i32 {
  return 0;
}
export function sock_accept(_fd: i32, _flags: i32, _opened_fd: i32): i32 {
  return 0;
}
