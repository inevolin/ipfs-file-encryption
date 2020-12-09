# IPFS File Encryption in NodeJS

This repo shows how to encrypt files prior to uploading them to IPFS. Similarly it can decrypt and download these files. The solution uses both RSA and AES encryption algorithms to achieve maximum security.

## installation
Download and install IPFS CLI: https://docs.ipfs.io/install/command-line/#official-distributions

Init IPFS: `ipfs init`

Start IPFS: `ipfs daemon`

Run the following in another prompt:
```
git clone https://github.com/healzer/ipfs-file-encryption.git
cd ipfs-file-encryption

npm install

node index.js
```
## usage

### webUI
IPFS has a webUI located at http://localhost:5001/webui/

### file upload and download functions
Use the provided `_testing()` function to test and verify these features:

```JS
async function _testing() {
  const file = 'package.json'  // file to upload
  const ipfspath = '/encrypted/data/' + file // ipfspath
  
  // upload to ipfs path
  await uploadFileEncrypted(file, ipfspath)
  
  // download from ipfs path
  const dl = await downloadFileEncrypted(ipfspath)
  
  // to buffer
  const buff = Buffer.from(dl, 'hex')

  // save buffer to file
  const outfile = ipfspath.replace(/\//g, '_');
  console.log('writing:', outfile)
  fs.writeFile(outfile, buff, function(err) {
    if (err) throw err;
  })
}
```
### file browser
Visit http://localhost:3000/ to see all the uploaded files. Clicking the filename will decrypt and download that file.

### config
You may want to change these variables in `index.js` depending on your environment:

`ipfsEndPoint (default: 'http://localhost:5001')`

`rest_port (default: 3000)`

### cryptography

The encryption strategy uses both RSA and AES to achieve maximum security.
Encrypting a file for upload is done as shown on the diagram below, all of this happens in-memory.
For very large files you may want to do this on-disk instead (e.g. using pipes).

![file forward encryption](https://raw.githubusercontent.com/healzer/ipfs-file-encryption/main/assets/imgs/ipfs_encrypt.png?token=ACIMQFUGCX2TFDIEK6MNOWK72C6LC)

The output file consists of a header, RSA encrypted key + IV, and the AES encrypted data of the original file.

Decrypting the file happens in a similar fashion:
1. Downloads the file (in-memory).
2. Extracts the encrypted key from the header.
3. Decrypts the key using your RSA private key.
4. Extracts the IV value from the header.
5. Decrypts the file data using the decrypted key from step 3 and the IV value.

#### Notes
We use both RSA and AES algorithms: RSA can only encrypt a limited amount of data, no longer than its key size, thus we us it to encrypt the AES's secret key. Then the symmetrical AES strategy is used for encrypting potentially large amounts of data, the file data itself.

You could use AES solely as well for simplicity reasons. However the advantage of having RSA included is that we can generate many RSA decryption keys (= private key) for end-users whilst having only one encryption key (= public key); instead of sharing just one key with all of the users.

Further developments are definitely possible and in some cases encouraged.

