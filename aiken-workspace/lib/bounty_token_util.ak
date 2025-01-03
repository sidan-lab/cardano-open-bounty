use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use mocktail.{mock_pub_key_hash}

pub fn has_all_signers(
  all_signers: List<VerificationKeyHash>,
  actual_signers: List<VerificationKeyHash>,
) -> Bool {
  when all_signers is {
    [] -> True
    [head, ..tail] ->
      if !list.has(actual_signers, head) {
        False
      } else {
        has_all_signers(tail, actual_signers)
      }
  }
}

test address_check() {
  let all_signers: List<ByteArray> =
    [
      mock_pub_key_hash(3),
      mock_pub_key_hash(2),
      mock_pub_key_hash(1),
      mock_pub_key_hash(0),
    ]
  let actual_signers: List<ByteArray> =
    [
      mock_pub_key_hash(0),
      mock_pub_key_hash(1),
      mock_pub_key_hash(2),
      mock_pub_key_hash(3),
    ]
  has_all_signers(all_signers: all_signers, actual_signers: actual_signers)
}
