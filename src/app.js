import { myVis, myGeoVis } from "./index"

// if the data you are going to import is small, then you can import it using es6 import
// import MY_DATA from './app/data/example.json'
// (I tend to think it's best to use screaming snake case for imported json)
const domReady = require('domready');

domReady(() => {
  // this is just one example of how to import data. there are lots of ways to do it!
  fetch('./data/ceilings_v3.csv')
    .then(data => {
      myVis(data);
      myGeoVis();
    })
    .catch(e => {
      console.log(e);
    });
});