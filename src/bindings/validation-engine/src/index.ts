import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




/**
 * Transaction validation states.
 */
export enum TxState {
  Approved = 0,
  Rejected = 1,
  Expired = 2,
  Pending = 3,
  Unknown = 4,
}

/**
 * Validation modes.
 * On-chain they only affect intent hashing; policy content stays off-chain.
 */
export enum ValidationMode {
  Dapp = 0,
}

export const Errors = {
  1: {message:"Unauthorized"},
  2: {message:"ValidationExpired"},
  3: {message:"ValidationTooEarly"},
  4: {message:"AlreadySubmitted"},
  5: {message:"NotApproved"},
  6: {message:"Sanctioned"},
  7: {message:"NotPending"},
  8: {message:"SanctionsKeyUnknown"}
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Registry", values: void} | {tag: "Auditor", values: void} | {tag: "TrustlineOracleEnabled", values: void} | {tag: "SanctionsOracleEnabled", values: void} | {tag: "SanctionsList", values: void} | {tag: "SanctionsKey", values: void} | {tag: "AutoValiditySecs", values: void} | {tag: "ManualValiditySecs", values: void} | {tag: "MaxSkewSecs", values: void} | {tag: "Tx", values: readonly [Buffer]};


export interface TxMetadata {
  created_at: u64;
  state: TxState;
  valid_until: u64;
}

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a add_tx transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_tx: ({oracle, id, policy_hash, timestamp, approval_required}: {oracle: string, id: Buffer, policy_hash: Buffer, timestamp: u64, approval_required: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  version: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a registry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  registry: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_auditor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_auditor: ({new_auditor}: {new_auditor: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_tx_state transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_tx_state: ({sender, id, addresses}: {sender: string, id: Buffer, addresses: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<TxState>>

  /**
   * Construct and simulate a transfer_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a check_status_adv transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  check_status_adv: ({protocol, mode, sender, value, data, addresses}: {protocol: string, mode: ValidationMode, sender: string, value: i128, data: Buffer, addresses: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a compute_intent_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  compute_intent_id: ({mode, sender, protocol, value, data}: {mode: ValidationMode, sender: string, protocol: string, value: i128, data: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a require_trustline transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  require_trustline: ({protocol, sender, value, data}: {protocol: string, sender: string, value: i128, data: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a check_status_addrs transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  check_status_addrs: ({protocol, sender, value, data, addresses}: {protocol: string, sender: string, value: i128, data: Buffer, addresses: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a approve_or_reject_tx transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve_or_reject_tx: ({id, decision}: {id: Buffer, decision: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a require_trustline_adv transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  require_trustline_adv: ({protocol, mode, sender, value, data, addresses}: {protocol: string, mode: ValidationMode, sender: string, value: i128, data: Buffer, addresses: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a check_trustline_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  check_trustline_status: ({protocol, sender, value, data}: {protocol: string, sender: string, value: i128, data: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a require_trustline_addrs transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  require_trustline_addrs: ({protocol, sender, value, data, addresses}: {protocol: string, sender: string, value: i128, data: Buffer, addresses: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a sanctions_oracle_enabled transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  sanctions_oracle_enabled: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a trustline_oracle_enabled transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  trustline_oracle_enabled: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_validation_configuration transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_validation_configuration: ({trustline_enabled, sanctions_enabled, sanctions_key}: {trustline_enabled: boolean, sanctions_enabled: boolean, sanctions_key: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, registry, auto_validity_secs, manual_validity_secs, max_skew_secs}: {admin: string, registry: string, auto_validity_secs: u64, manual_validity_secs: u64, max_skew_secs: u64},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, registry, auto_validity_secs, manual_validity_secs, max_skew_secs}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAGYWRkX3R4AAAAAAAFAAAAAAAAAAZvcmFjbGUAAAAAABMAAAAAAAAAAmlkAAAAAAPuAAAAIAAAAAAAAAALcG9saWN5X2hhc2gAAAAD7gAAACAAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAYAAAAAAAAAEWFwcHJvdmFsX3JlcXVpcmVkAAAAAAAAAQAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAIcmVnaXN0cnkAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAALc2V0X2F1ZGl0b3IAAAAAAQAAAAAAAAALbmV3X2F1ZGl0b3IAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAMZ2V0X3R4X3N0YXRlAAAAAwAAAAAAAAAGc2VuZGVyAAAAAAATAAAAAAAAAAJpZAAAAAAD7gAAACAAAAAAAAAACWFkZHJlc3NlcwAAAAAAA+oAAAATAAAAAQAAB9AAAAAHVHhTdGF0ZQA=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAUAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIcmVnaXN0cnkAAAATAAAAAAAAABJhdXRvX3ZhbGlkaXR5X3NlY3MAAAAAAAYAAAAAAAAAFG1hbnVhbF92YWxpZGl0eV9zZWNzAAAABgAAAAAAAAANbWF4X3NrZXdfc2VjcwAAAAAAAAYAAAAA",
        "AAAAAAAAAAAAAAAOdHJhbnNmZXJfYWRtaW4AAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAQY2hlY2tfc3RhdHVzX2FkdgAAAAYAAAAAAAAACHByb3RvY29sAAAAEwAAAAAAAAAEbW9kZQAAB9AAAAAOVmFsaWRhdGlvbk1vZGUAAAAAAAAAAAAGc2VuZGVyAAAAAAATAAAAAAAAAAV2YWx1ZQAAAAAAAAsAAAAAAAAABGRhdGEAAAAOAAAAAAAAAAlhZGRyZXNzZXMAAAAAAAPqAAAAEwAAAAEAAAAB",
        "AAAAAAAAAAAAAAARY29tcHV0ZV9pbnRlbnRfaWQAAAAAAAAFAAAAAAAAAARtb2RlAAAH0AAAAA5WYWxpZGF0aW9uTW9kZQAAAAAAAAAAAAZzZW5kZXIAAAAAABMAAAAAAAAACHByb3RvY29sAAAAEwAAAAAAAAAFdmFsdWUAAAAAAAALAAAAAAAAAARkYXRhAAAADgAAAAEAAAPuAAAAIA==",
        "AAAAAAAAAAAAAAARcmVxdWlyZV90cnVzdGxpbmUAAAAAAAAEAAAAAAAAAAhwcm90b2NvbAAAABMAAAAAAAAABnNlbmRlcgAAAAAAEwAAAAAAAAAFdmFsdWUAAAAAAAALAAAAAAAAAARkYXRhAAAADgAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAASY2hlY2tfc3RhdHVzX2FkZHJzAAAAAAAFAAAAAAAAAAhwcm90b2NvbAAAABMAAAAAAAAABnNlbmRlcgAAAAAAEwAAAAAAAAAFdmFsdWUAAAAAAAALAAAAAAAAAARkYXRhAAAADgAAAAAAAAAJYWRkcmVzc2VzAAAAAAAD6gAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAUYXBwcm92ZV9vcl9yZWplY3RfdHgAAAACAAAAAAAAAAJpZAAAAAAD7gAAACAAAAAAAAAACGRlY2lzaW9uAAAAAQAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAAVcmVxdWlyZV90cnVzdGxpbmVfYWR2AAAAAAAABgAAAAAAAAAIcHJvdG9jb2wAAAATAAAAAAAAAARtb2RlAAAH0AAAAA5WYWxpZGF0aW9uTW9kZQAAAAAAAAAAAAZzZW5kZXIAAAAAABMAAAAAAAAABXZhbHVlAAAAAAAACwAAAAAAAAAEZGF0YQAAAA4AAAAAAAAACWFkZHJlc3NlcwAAAAAAA+oAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAAWY2hlY2tfdHJ1c3RsaW5lX3N0YXR1cwAAAAAABAAAAAAAAAAIcHJvdG9jb2wAAAATAAAAAAAAAAZzZW5kZXIAAAAAABMAAAAAAAAABXZhbHVlAAAAAAAACwAAAAAAAAAEZGF0YQAAAA4AAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAXcmVxdWlyZV90cnVzdGxpbmVfYWRkcnMAAAAABQAAAAAAAAAIcHJvdG9jb2wAAAATAAAAAAAAAAZzZW5kZXIAAAAAABMAAAAAAAAABXZhbHVlAAAAAAAACwAAAAAAAAAEZGF0YQAAAA4AAAAAAAAACWFkZHJlc3NlcwAAAAAAA+oAAAATAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAAYc2FuY3Rpb25zX29yYWNsZV9lbmFibGVkAAAAAAAAAAEAAAAB",
        "AAAAAAAAAAAAAAAYdHJ1c3RsaW5lX29yYWNsZV9lbmFibGVkAAAAAAAAAAEAAAAB",
        "AAAAAAAAAAAAAAAcc2V0X3ZhbGlkYXRpb25fY29uZmlndXJhdGlvbgAAAAMAAAAAAAAAEXRydXN0bGluZV9lbmFibGVkAAAAAAAAAQAAAAAAAAARc2FuY3Rpb25zX2VuYWJsZWQAAAAAAAABAAAAAAAAAA1zYW5jdGlvbnNfa2V5AAAAAAAD6AAAABAAAAABAAAD6QAAAAIAAAAD",
        "AAAAAwAAAEBUcmFuc2FjdGlvbiB2YWxpZGF0aW9uIHN0YXRlcyAoRVZNIGBJVmFsaWRhdGlvbk9yYWNsZS5UeFN0YXRlYCkuAAAAAAAAAAdUeFN0YXRlAAAAAAUAAAAAAAAACEFwcHJvdmVkAAAAAAAAAAAAAAAIUmVqZWN0ZWQAAAABAAAAAAAAAAdFeHBpcmVkAAAAAAIAAAAAAAAAB1BlbmRpbmcAAAAAAwAAAAAAAAAHVW5rbm93bgAAAAAE",
        "AAAAAwAAAIRWYWxpZGF0aW9uIG1vZGVzIChFVk0gYElWYWxpZGF0aW9uRW5naW5lLlZhbGlkYXRpb25Nb2RlYCkuCk9uLWNoYWluIHRoZXkgb25seSBhZmZlY3QgaW50ZW50IGhhc2hpbmc7IHBvbGljeSBjb250ZW50IHN0YXlzIG9mZi1jaGFpbi4AAAAAAAAADlZhbGlkYXRpb25Nb2RlAAAAAAAEAAAAAAAAAAREYXBwAAAAAAAAAAAAAAAJVW5pc3dhcFY0AAAAAAAAAQAAAAAAAAAITW9ycGhvVjIAAAACAAAAAAAAAAdFUkMzNjQzAAAAAAM=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACAAAAAAAAAAMVW5hdXRob3JpemVkAAAAAQAAAAAAAAARVmFsaWRhdGlvbkV4cGlyZWQAAAAAAAACAAAAAAAAABJWYWxpZGF0aW9uVG9vRWFybHkAAAAAAAMAAAAAAAAAEEFscmVhZHlTdWJtaXR0ZWQAAAAEAAAAAAAAAAtOb3RBcHByb3ZlZAAAAAAFAAAAAAAAAApTYW5jdGlvbmVkAAAAAAAGAAAAAAAAAApOb3RQZW5kaW5nAAAAAAAHAAAAAAAAABNTYW5jdGlvbnNLZXlVbmtub3duAAAAAAg=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAIUmVnaXN0cnkAAAAAAAAAAAAAAAdBdWRpdG9yAAAAAAAAAAAAAAAAFlRydXN0bGluZU9yYWNsZUVuYWJsZWQAAAAAAAAAAAAAAAAAFlNhbmN0aW9uc09yYWNsZUVuYWJsZWQAAAAAAAAAAAAAAAAADVNhbmN0aW9uc0xpc3QAAAAAAAAAAAAAAAAAAAxTYW5jdGlvbnNLZXkAAAAAAAAAAAAAABBBdXRvVmFsaWRpdHlTZWNzAAAAAAAAAAAAAAASTWFudWFsVmFsaWRpdHlTZWNzAAAAAAAAAAAAAAAAAAtNYXhTa2V3U2VjcwAAAAABAAAAAAAAAAJUeAAAAAAAAQAAA+4AAAAg",
        "AAAAAQAAAAAAAAAAAAAAClR4TWV0YWRhdGEAAAAAAAMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAABXN0YXRlAAAAAAAH0AAAAAdUeFN0YXRlAAAAAAAAAAALdmFsaWRfdW50aWwAAAAABg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<string>,
        add_tx: this.txFromJSON<Result<void>>,
        upgrade: this.txFromJSON<null>,
        version: this.txFromJSON<u32>,
        registry: this.txFromJSON<string>,
        set_auditor: this.txFromJSON<null>,
        get_tx_state: this.txFromJSON<TxState>,
        transfer_admin: this.txFromJSON<null>,
        check_status_adv: this.txFromJSON<boolean>,
        compute_intent_id: this.txFromJSON<Buffer>,
        require_trustline: this.txFromJSON<Result<void>>,
        check_status_addrs: this.txFromJSON<boolean>,
        approve_or_reject_tx: this.txFromJSON<Result<void>>,
        require_trustline_adv: this.txFromJSON<Result<void>>,
        check_trustline_status: this.txFromJSON<boolean>,
        require_trustline_addrs: this.txFromJSON<Result<void>>,
        sanctions_oracle_enabled: this.txFromJSON<boolean>,
        trustline_oracle_enabled: this.txFromJSON<boolean>,
        set_validation_configuration: this.txFromJSON<Result<void>>
  }
}