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

![file forward encryption](/assets/imgs/ipfs_encrypt.png?raw=true)

*note: The 16 byte key and 8 byte IV values are converted to hex and result in a 32 byte key and 16 byte IV as required by the AES encryption algo.*

The output file consists of a header, RSA encrypted key + IV, and the AES encrypted data of the original file.

Decrypting the file happens in a similar fashion:
1. Downloads the file (in-memory).
2. Extracts the encrypted key from the header.
3. Decrypts the key using your RSA private key.
4. Extracts the IV value from the header.
5. Decrypts the file data using the decrypted key from step 3 and the IV value.

#### notes
We use both RSA and AES algorithms: RSA can only encrypt a limited amount of data, no longer than its key size, thus we use it to encrypt the AES's secret key. Then the symmetrical AES strategy is used for encrypting potentially large amounts of data, i.e. the file's data itself.

You could use AES solely as well for simplicity reasons. However the advantage of having RSA included is that we can generate many RSA decryption keys (= private keys) for end-users whilst having only one encryption key (= public key); instead of sharing just one key with all of the users.

Further developments are definitely possible and in some cases encouraged.

## Contact

For enquiries or issues get in touch with me:

Name: [Ilya Nevolin](https://www.linkedin.com/in/iljanevolin/)

Email: ilja.nevolin@gmail.com

## Q&A
```
Q:  How would you solve sharing these encrypted images with
    a friend via a public link?
    
A:  This REST service can be hosted on a cloud server.
    Once can access the API, and thus download files as such:
      http://<IP, domain, localhost>:PORT/api/file/encrypted/data/<filename>
    Decryption is being handled by the REST service.
  
  
Q:  How would you improve the key management?

A:  In the current state anyone can access, download and decrypt the data.
    A secure solution will need to authenticate and authorize users.
    Whereby each user has its own private key for decrypting the data.
    
    This can be done using accounts (login / dashboard pages):
      - user creates an account (username and password OR using third-party auth like Google/Github/...)
      - a private key will be generated for the account
    * a database system should be utilized
    
    Another solution would be to store the private key in the browser's local storage.
    The key will then be provided to the API.
    Some web portal will have to be built for this as well.
    note: both solutions should be served over HTTPS/SSL
    
    
Q:  How would you compare and contrast HTTP with p2p protocols
    like IPFS and BitTorrent in terms of performance and availability?
    
A:  IPFS dominates over bittorrent in terms of availability and performance.
    Due to content-addressing it prevents file duplication.
    
    Individual file(s) can be easily downloaded from some "source";
    whereas with BitTorrent one has to create a ".torrent" file, submit it to tracker(s) and seed it.
    
    IPFS on the other hand is much faster on making files available for sharing.
    IPFS files can be distributed and load-balanced, making it a perfect CDN solution.
    This isn't possible with BitTorrent at all.
    
    File-streaming works out of the box over HTTP in IPFS.
    Whereas streaming in BitTorrent is a paid feature.
    
    Large files are being chunked/sharded in IPFS.
    So one can download chunks from different nodes and maximize bandwidth usage.
    This is both done in IPFS and BitTorrent.
    
    BitTorrent has a high barrier to entry for new people trying to share files.
    Whereas IPFS easily integrates to a drag-and-drop interface.
    
    With IPFS one chooses which files he/she wants to "seed".
    While BitTorrent requires you to seed all files within the torrent.
    *   BitTorrent clients did improve over the years,
        it is possible to download file subsets,
        and it may be possile to seed file subsets.
        
    IPFS works over HTTP REST, whereas torrents only work over the BitTorrent protocol.
    This makes it harder for the community to build p2p apps/services/solutions.
    
    
Q: How would you improve BitTorrent protocol if you had a chance?

A:  Focus on simplicity and community:
      - simplify the protocol / architecture
      - build it on HTTP REST.
    This way the community can innovate at a much faster pace.
    
    
```
