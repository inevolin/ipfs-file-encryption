# ipfs demos

## installation
Download and install IPFS CLI: https://docs.ipfs.io/install/command-line/#official-distributions

Init IPFS: `ipfs init`

Start IPFS: `ipfs daemon`

Run the following in another prompt:
```
git clone https://github.com/healzer/ipfs-demos.git
cd ipfs-demos

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
Visit http://localhost:3000/ to see all your uploaded files. Clicking the filename will decrypt and download that file.

### config
You may want to change these variables in `index.js` depending on your environment:

`ipfsEndPoint (default: 'http://localhost:5001')`

`rest_port (default: 3000)`
