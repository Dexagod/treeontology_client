# treeontology_client

This package is not yet published on npm.
Download the package, and install by using:

'''npm install <path to package>'''

the treebrowser package is also required to run this client, and can be found here: https://github.com/Dexagod/ldtreeBrowser
It can also be installed by using:

'''npm install <path to package>'''

usage:
'''
let Parser = require("treebrowser").Parser 
let queryEngine = require('finalqueryengine')

let myParser = new Parser() // A parser object keeps a local cache through the ldfetch package. Reusing the same parser improves performance on subsequent requests.

let prefixString = "Technologiepark";
let targetURL = "http://193.190.127.164/"

let query = new queryEngine.PrefixQuery(myParser, targetURL)

let query = new datastructureManager["query"](userParser, );
      query.on("data", (data) => console.log(data) ) 

let session = null // A session object contains the current state of the query on finish. If a subsequent query can build on the previous one, pass the session object, and the query will continue from that point in the tree.
// THIS TEST IS REQUIRED TO BE DONE BEFORE PASSING THE SESSION OBJECT TO THE QUERY!
// In case it is a new query, pass a null object for the session.

let session = query.query(queryUrl, searchvalue, session)


// When you have the required amount of results, you can stop a query by calling 
query.interrupt()
// This will halt the fetching of new pages over the web, but will  continue to emit data untill all data has been emitted.
// This way no entries will be missed when reusing the session.



'''


Possible queries include:
export { PartialCollectionViewQuery } from './queries/PartialCollectionViewQuery';
export { BTreeQuery } from './queries/BTreeQuery';
export { BTreePrefixQuery } from './queries/BTreePrefixQuery';
export { WKTStringQuery } from './queries/WKTStringQuery';
export { PrefixQuery } from './queries/PrefixQuery';
