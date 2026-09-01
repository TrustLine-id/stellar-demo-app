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
 * Validation mode included in the intent hash domain.
 * 
 * Only [`ValidationMode::Dapp`] is supported for now. Additional modes may be
 * added later without changing the hashing scheme.
 */
export enum ValidationMode {
  Dapp = 0,
}

export interface Client {
  /**
   * Construct and simulate a owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Firewall admin (configuration only — not an operator by default).
   */
  owner: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a target transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Protected contract address.
   */
  target: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a forward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Forward a call to `target` after Trustline validation.
   * 
   * `initiator` is the business actor for Trustline (`require_trustline` sender) and
   * must authorize this call. When `public_forward` is false, `initiator` must also
   * be registered as an operator.
   */
  forward: ({initiator, fn_name, args}: {initiator: string, fn_name: string, args: Array<any>}, options?: MethodOptions) => Promise<AssembledTransaction<any>>

  /**
   * Construct and simulate a set_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfer firewall admin — owner only, Trustline-protected.
   */
  set_owner: ({new_owner}: {new_owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_target transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update target — owner only, Trustline-protected.
   */
  set_target: ({new_target}: {new_target: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_operator transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Whether `account` may call `forward` when `public_forward` is false.
   */
  is_operator: ({account}: {account: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_operator transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Add or remove an operator allowed on the protected `forward` path.
   */
  set_operator: ({account, is_operator}: {account: string, is_operator: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a public_forward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * When true, any authenticated initiator may call `forward`.
   */
  public_forward: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_public_forward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Allow or disallow unrestricted initiators on `forward`.
   */
  set_public_forward: ({enabled}: {enabled: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a forward_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pure helper: builds the `data` blob used in the Trustline intent for `forward`.
   */
  forward_intent_data: ({fn_name, args}: {fn_name: string, args: Array<any>}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a set_owner_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pure helper: intent `data` for `set_owner`.
   */
  set_owner_intent_data: ({new_owner}: {new_owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a set_target_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pure helper: intent `data` for `set_target`.
   */
  set_target_intent_data: ({new_target}: {new_target: string}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a set_operator_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pure helper: intent `data` for `set_operator`.
   */
  set_operator_intent_data: ({account, is_operator}: {account: string, is_operator: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a set_public_forward_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pure helper: intent `data` for `set_public_forward`.
   */
  set_public_forward_intent_data: ({enabled}: {enabled: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {target, validation_engine, initial_owner, initial_operator, initial_public_forward}: {target: string, validation_engine: string, initial_owner: string, initial_operator: Option<string>, initial_public_forward: boolean},
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
    return ContractClient.deploy({target, validation_engine, initial_owner, initial_operator, initial_public_forward}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAENGaXJld2FsbCBhZG1pbiAoY29uZmlndXJhdGlvbiBvbmx5IOKAlCBub3QgYW4gb3BlcmF0b3IgYnkgZGVmYXVsdCkuAAAAAAVvd25lcgAAAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAABtQcm90ZWN0ZWQgY29udHJhY3QgYWRkcmVzcy4AAAAABnRhcmdldAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAPZGb3J3YXJkIGEgY2FsbCB0byBgdGFyZ2V0YCBhZnRlciBUcnVzdGxpbmUgdmFsaWRhdGlvbi4KCmBpbml0aWF0b3JgIGlzIHRoZSBidXNpbmVzcyBhY3RvciBmb3IgVHJ1c3RsaW5lIChgcmVxdWlyZV90cnVzdGxpbmVgIHNlbmRlcikgYW5kCm11c3QgYXV0aG9yaXplIHRoaXMgY2FsbC4gV2hlbiBgcHVibGljX2ZvcndhcmRgIGlzIGZhbHNlLCBgaW5pdGlhdG9yYCBtdXN0IGFsc28KYmUgcmVnaXN0ZXJlZCBhcyBhbiBvcGVyYXRvci4AAAAAAAdmb3J3YXJkAAAAAAMAAAAAAAAACWluaXRpYXRvcgAAAAAAABMAAAAAAAAAB2ZuX25hbWUAAAAAEQAAAAAAAAAEYXJncwAAA+oAAAAAAAAAAQAAAAA=",
        "AAAAAAAAADxUcmFuc2ZlciBmaXJld2FsbCBhZG1pbiDigJQgb3duZXIgb25seSwgVHJ1c3RsaW5lLXByb3RlY3RlZC4AAAAJc2V0X293bmVyAAAAAAAAAQAAAAAAAAAJbmV3X293bmVyAAAAAAAAEwAAAAA=",
        "AAAAAAAAADJVcGRhdGUgdGFyZ2V0IOKAlCBvd25lciBvbmx5LCBUcnVzdGxpbmUtcHJvdGVjdGVkLgAAAAAACnNldF90YXJnZXQAAAAAAAEAAAAAAAAACm5ld190YXJnZXQAAAAAABMAAAAA",
        "AAAAAAAAAERXaGV0aGVyIGBhY2NvdW50YCBtYXkgY2FsbCBgZm9yd2FyZGAgd2hlbiBgcHVibGljX2ZvcndhcmRgIGlzIGZhbHNlLgAAAAtpc19vcGVyYXRvcgAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAEJBZGQgb3IgcmVtb3ZlIGFuIG9wZXJhdG9yIGFsbG93ZWQgb24gdGhlIHByb3RlY3RlZCBgZm9yd2FyZGAgcGF0aC4AAAAAAAxzZXRfb3BlcmF0b3IAAAACAAAAAAAAAAdhY2NvdW50AAAAABMAAAAAAAAAC2lzX29wZXJhdG9yAAAAAAEAAAAA",
        "AAAAAAAAAGhEZXBsb3kgdGhlIGZpcmV3YWxsIGluIGZyb250IG9mIGB0YXJnZXRgLgoKUGFzcyB0aGUgYWxyZWFkeSBkZXBsb3llZCBWYWxpZGF0aW9uIEVuZ2luZSBpbnN0YW5jZSBhZGRyZXNzLgAAAA1fX2NvbnN0cnVjdG9yAAAAAAAABQAAAAAAAAAGdGFyZ2V0AAAAAAATAAAAAAAAABF2YWxpZGF0aW9uX2VuZ2luZQAAAAAAABMAAAAAAAAADWluaXRpYWxfb3duZXIAAAAAAAATAAAAAAAAABBpbml0aWFsX29wZXJhdG9yAAAD6AAAABMAAAAAAAAAFmluaXRpYWxfcHVibGljX2ZvcndhcmQAAAAAAAEAAAAA",
        "AAAAAAAAADpXaGVuIHRydWUsIGFueSBhdXRoZW50aWNhdGVkIGluaXRpYXRvciBtYXkgY2FsbCBgZm9yd2FyZGAuAAAAAAAOcHVibGljX2ZvcndhcmQAAAAAAAAAAAABAAAAAQ==",
        "AAAAAAAAADdBbGxvdyBvciBkaXNhbGxvdyB1bnJlc3RyaWN0ZWQgaW5pdGlhdG9ycyBvbiBgZm9yd2FyZGAuAAAAABJzZXRfcHVibGljX2ZvcndhcmQAAAAAAAEAAAAAAAAAB2VuYWJsZWQAAAAAAQAAAAA=",
        "AAAAAAAAAE9QdXJlIGhlbHBlcjogYnVpbGRzIHRoZSBgZGF0YWAgYmxvYiB1c2VkIGluIHRoZSBUcnVzdGxpbmUgaW50ZW50IGZvciBgZm9yd2FyZGAuAAAAABNmb3J3YXJkX2ludGVudF9kYXRhAAAAAAIAAAAAAAAAB2ZuX25hbWUAAAAAEQAAAAAAAAAEYXJncwAAA+oAAAAAAAAAAQAAAA4=",
        "AAAAAAAAACtQdXJlIGhlbHBlcjogaW50ZW50IGBkYXRhYCBmb3IgYHNldF9vd25lcmAuAAAAABVzZXRfb3duZXJfaW50ZW50X2RhdGEAAAAAAAABAAAAAAAAAAluZXdfb3duZXIAAAAAAAATAAAAAQAAAA4=",
        "AAAAAAAAACxQdXJlIGhlbHBlcjogaW50ZW50IGBkYXRhYCBmb3IgYHNldF90YXJnZXRgLgAAABZzZXRfdGFyZ2V0X2ludGVudF9kYXRhAAAAAAABAAAAAAAAAApuZXdfdGFyZ2V0AAAAAAATAAAAAQAAAA4=",
        "AAAAAAAAAC5QdXJlIGhlbHBlcjogaW50ZW50IGBkYXRhYCBmb3IgYHNldF9vcGVyYXRvcmAuAAAAAAAYc2V0X29wZXJhdG9yX2ludGVudF9kYXRhAAAAAgAAAAAAAAAHYWNjb3VudAAAAAATAAAAAAAAAAtpc19vcGVyYXRvcgAAAAABAAAAAQAAAA4=",
        "AAAAAAAAADRQdXJlIGhlbHBlcjogaW50ZW50IGBkYXRhYCBmb3IgYHNldF9wdWJsaWNfZm9yd2FyZGAuAAAAHnNldF9wdWJsaWNfZm9yd2FyZF9pbnRlbnRfZGF0YQAAAAAAAQAAAAAAAAAHZW5hYmxlZAAAAAABAAAAAQAAAA4=",
        "AAAAAwAAALFWYWxpZGF0aW9uIG1vZGUgaW5jbHVkZWQgaW4gdGhlIGludGVudCBoYXNoIGRvbWFpbi4KCk9ubHkgW2BWYWxpZGF0aW9uTW9kZTo6RGFwcGBdIGlzIHN1cHBvcnRlZCBmb3Igbm93LiBBZGRpdGlvbmFsIG1vZGVzIG1heSBiZQphZGRlZCBsYXRlciB3aXRob3V0IGNoYW5naW5nIHRoZSBoYXNoaW5nIHNjaGVtZS4AAAAAAAAAAAAADlZhbGlkYXRpb25Nb2RlAAAAAAABAAAAAAAAAAREYXBwAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    owner: this.txFromJSON<string>,
        target: this.txFromJSON<string>,
        forward: this.txFromJSON<any>,
        set_owner: this.txFromJSON<null>,
        set_target: this.txFromJSON<null>,
        is_operator: this.txFromJSON<boolean>,
        set_operator: this.txFromJSON<null>,
        public_forward: this.txFromJSON<boolean>,
        set_public_forward: this.txFromJSON<null>,
        forward_intent_data: this.txFromJSON<Buffer>,
        set_owner_intent_data: this.txFromJSON<Buffer>,
        set_target_intent_data: this.txFromJSON<Buffer>,
        set_operator_intent_data: this.txFromJSON<Buffer>,
        set_public_forward_intent_data: this.txFromJSON<Buffer>
  }
}