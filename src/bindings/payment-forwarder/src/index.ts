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

export interface Client {
  /**
   * Construct and simulate a pay_native transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pay via a Stellar Asset Contract (typically the native XLM SAC).
   */
  pay_native: ({sender, native_token, destination, amount}: {sender: string, native_token: string, destination: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a pay_tokens transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pay SEP-41 tokens.
   */
  pay_tokens: ({sender, destination, token, amount}: {sender: string, destination: string, token: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a validation_engine transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  validation_engine: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a pay_native_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Intent `data` for `pay_native` (frontend / oracle prevalidation).
   * 
   * Includes `native_token` so the SAC used for the transfer is bound to the
   * proof (native amount is an explicit argument, not ambient call value).
   */
  pay_native_intent_data: ({native_token, destination, amount}: {native_token: string, destination: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a pay_tokens_intent_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Intent `data` for `pay_tokens`.
   */
  pay_tokens_intent_data: ({destination, token, amount}: {destination: string, token: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {validation_engine}: {validation_engine: string},
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
    return ContractClient.deploy({validation_engine}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAF9QYXkgdmlhIGEgU3RlbGxhciBBc3NldCBDb250cmFjdCAodHlwaWNhbGx5IHRoZSBuYXRpdmUgWExNIFNBQykuCgpFVk0gYHBheUV0aGVycyhkZXN0aW5hdGlvbilgLgAAAAAKcGF5X25hdGl2ZQAAAAAABAAAAAAAAAAGc2VuZGVyAAAAAAATAAAAAAAAAAxuYXRpdmVfdG9rZW4AAAATAAAAAAAAAAtkZXN0aW5hdGlvbgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAD9QYXkgU0VQLTQxIHRva2Vucy4KCkVWTSBgcGF5VG9rZW5zKGRlc3RpbmF0aW9uLCB0b2tlbiwgdmFsdWUpYC4AAAAACnBheV90b2tlbnMAAAAAAAQAAAAAAAAABnNlbmRlcgAAAAAAEwAAAAAAAAALZGVzdGluYXRpb24AAAAAEwAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAFRFVk0gY29uc3RydWN0b3IgYChsb2dpYywgcHJveHkpYCDihpIgU29yb2JhbjogcGFzcyB0aGUgZGVwbG95ZWQgVkUgaW5zdGFuY2UgYWRkcmVzcy4AAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAAEXZhbGlkYXRpb25fZW5naW5lAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAARdmFsaWRhdGlvbl9lbmdpbmUAAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAM1JbnRlbnQgYGRhdGFgIGZvciBgcGF5X25hdGl2ZWAgKGZyb250ZW5kIC8gb3JhY2xlIHByZXZhbGlkYXRpb24pLgoKSW5jbHVkZXMgYG5hdGl2ZV90b2tlbmAgc28gdGhlIFNBQyB1c2VkIGZvciB0aGUgdHJhbnNmZXIgaXMgYm91bmQgdG8gdGhlCnByb29mIChTdGVsbGFyIGhhcyBubyBhbWJpZW50IG5hdGl2ZSBhc3NldCBsaWtlIEVWTSBgbXNnLnZhbHVlYCkuAAAAAAAAFnBheV9uYXRpdmVfaW50ZW50X2RhdGEAAAAAAAMAAAAAAAAADG5hdGl2ZV90b2tlbgAAABMAAAAAAAAAC2Rlc3RpbmF0aW9uAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAAO",
        "AAAAAAAAAB9JbnRlbnQgYGRhdGFgIGZvciBgcGF5X3Rva2Vuc2AuAAAAABZwYXlfdG9rZW5zX2ludGVudF9kYXRhAAAAAAADAAAAAAAAAAtkZXN0aW5hdGlvbgAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAAO",
        "AAAAAwAAAEBUcmFuc2FjdGlvbiB2YWxpZGF0aW9uIHN0YXRlcyAoRVZNIGBJVmFsaWRhdGlvbk9yYWNsZS5UeFN0YXRlYCkuAAAAAAAAAAdUeFN0YXRlAAAAAAUAAAAAAAAACEFwcHJvdmVkAAAAAAAAAAAAAAAIUmVqZWN0ZWQAAAABAAAAAAAAAAdFeHBpcmVkAAAAAAIAAAAAAAAAB1BlbmRpbmcAAAAAAwAAAAAAAAAHVW5rbm93bgAAAAAE",
        "AAAAAwAAAIRWYWxpZGF0aW9uIG1vZGVzIChFVk0gYElWYWxpZGF0aW9uRW5naW5lLlZhbGlkYXRpb25Nb2RlYCkuCk9uLWNoYWluIHRoZXkgb25seSBhZmZlY3QgaW50ZW50IGhhc2hpbmc7IHBvbGljeSBjb250ZW50IHN0YXlzIG9mZi1jaGFpbi4AAAAAAAAADlZhbGlkYXRpb25Nb2RlAAAAAAAEAAAAAAAAAAREYXBwAAAAAAAAAAAAAAAJVW5pc3dhcFY0AAAAAAAAAQAAAAAAAAAITW9ycGhvVjIAAAACAAAAAAAAAAdFUkMzNjQzAAAAAAM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    pay_native: this.txFromJSON<null>,
        pay_tokens: this.txFromJSON<null>,
        validation_engine: this.txFromJSON<string>,
        pay_native_intent_data: this.txFromJSON<Buffer>,
        pay_tokens_intent_data: this.txFromJSON<Buffer>
  }
}