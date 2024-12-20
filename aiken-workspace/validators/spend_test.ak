validator always_succeed {
  spend(_d, _r, _own_ref, _transaction) {
    True
  }

  else(_) {
    fail
  }
}
