const ipfsClient = require('ipfs-http-client');
const { globSource } = ipfsClient;
const ipfsEndPoint = 'http://localhost:5001'
const ipfs = ipfsClient(ipfsEndPoint);

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

////////////////////////////////
//////////// IPFS //////////////
////////////////////////////////

generateKeys()
// _testing()


async function uploadFileEncrypted(file, ipfspath) {
  try {
    const buff = fs.readFileSync(file);
    const key = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 chars
    const iv = crypto.randomBytes(8).toString('hex');   // 8 bytes -> 16 chars
    const ekey = encryptRSA(key); // 32 chars -> 684 chars
    const ebuff = encryptAES(buff, key, iv);

    const content = Buffer.concat([ // headers: encrypted key and IV (len: 700=684+16)
      Buffer.from(ekey, 'utf8'),   // char length: 684
      Buffer.from(iv, 'utf8'),     // char length: 16
      Buffer.from(ebuff, 'utf8')
    ])
    
    await ipfs.files.write(
      ipfspath,
      content,
      {create: true, parents: true}
    );

    console.log('ENCRYPTION --------')
    console.log('key:', key, 'iv:', iv, 'ekey:', ekey.length)
    console.log('contents:', buff.length, 'encrypted:', ebuff.length)
    console.log(' ')

  } catch (err) {
    console.log(err)
    throw err;
  }
}

async function toArray(asyncIterator) { 
  const arr=[]; 
  for await(const i of asyncIterator) {
    arr.push(i); 
  }
  return arr;
}

async function downloadFileEncrypted(ipfspath) {
  try {
    let file_data = await ipfs.files.read(ipfspath)
    
    let edata = []
    for await (const chunk of file_data)
      edata.push(chunk)
    edata = Buffer.concat(edata)

    const key = decryptRSA(edata.slice(0, 684).toString('utf8'))
    const iv = edata.slice(684, 700).toString('utf8')
    const econtent = edata.slice(700).toString('utf8')
    const ebuf = Buffer.from(econtent, 'hex')
    const content = decryptAES(ebuf, key, iv)

    console.log(' ')
    console.log('DECRYPTION --------')
    console.log('key:', key, 'iv:', iv)
    console.log('contents:', content.length, 'encrypted:', econtent.length)
    console.log('downloaded:', edata.length)
    
    return content
    
  } catch (err) {
    console.log(err)
    throw err;
  }
}

async function getUploadedFiles(ipfspath='/encrypted/') {
  let files = []
  const arr = await toArray(ipfs.files.ls(ipfspath))
  for (let file of arr) {
    if (file.type === 'directory') {
      const inner = await getUploadedFiles(ipfspath + file.name + '/')
      files = files.concat(inner)
    } else {
      files.push({
        path: ipfspath + file.name,
        size: file.size,
        cid: file.cid.toString()
      })
    }
  }
  return files
}

function encryptAES(buffer, secretKey, iv) {
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  const data = cipher.update(buffer);
  const encrypted = Buffer.concat([data, cipher.final()]);
  return encrypted.toString('hex')
}

function decryptAES(buffer, secretKey, iv) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
  const data = decipher.update(buffer)
  const decrpyted = Buffer.concat([data, decipher.final()]);
  return decrpyted;
}

function generateKeys() {
  if (fs.existsSync('private.pem') && fs.existsSync('public.pem'))
    return;
  
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: '',
    },
  })

  fs.writeFileSync('private.pem', privateKey)
  fs.writeFileSync('public.pem', publicKey)
}

function encryptRSA(toEncrypt, pubkeyPath='public.pem') {
  const absolutePath = path.resolve(pubkeyPath)
  const publicKey = fs.readFileSync(absolutePath, 'utf8')
  const buffer = Buffer.from(toEncrypt, 'utf8')
  const encrypted = crypto.publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

function decryptRSA(toDecrypt, privkeyPath='private.pem') {
  const absolutePath = path.resolve(privkeyPath)
  const privateKey = fs.readFileSync(absolutePath, 'utf8')
  const buffer = Buffer.from(toDecrypt, 'base64')
  const decrypted = crypto.privateDecrypt(
  {
    key: privateKey.toString(),
    passphrase: '',
  },
  buffer,
  )
  return decrypted.toString('utf8')
}

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

////////////////////////////////
///////// REST API /////////////
////////////////////////////////

const rest_port = 3000;
const express = require("express");
const app = express();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get("/api/files", async (req, res, next) => {
  try {
    res.json(await getUploadedFiles())
  } catch (e) {
    // when /encrypted/ path not exists (~ no uploads): catch ipfs http error
    res.json({error: e.toString()})
  }
});

app.get(/^\/api\/file(\/.*)$/, async (req, res, next) => {
  try {
    const ipfspath = req.params[0];
    const content = await downloadFileEncrypted(ipfspath)
    res.send(content)
  } catch (err) {
    res.send('error: ' + err)
  }
});

app.listen(rest_port, () => {
 console.log("Server running on port 3000");
});

////////////////////////////////
////////////////////////////////
////////////////////////////////


/*//////////////////////////////
///// WRITTEN QUESTIONS ////////
////////////////////////////////

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
    whereas with Bittorrent one has to create a ".torrent" file, submit it to tracker(s) and seed it.
    IPFS on the other hand is much faster on making files available for sharing.

    IPFS files can be distributed and load-balanced, making it a perfect CDN solution.
    This isn't possible with BitTOrrent at all.

    File-streaming works out of the box over HTTP in IPFS.
    Whereas streaming in BitTorrent is a paid feature.

    Large files are being chunked/sharded in IPFS.
    So one can download shunks from different nodes and maximize bandwidth usage.
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

////////////////////////////////
////////////////////////////////
//////////////////////////////*/