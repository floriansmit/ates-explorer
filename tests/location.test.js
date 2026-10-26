import {test} from 'node:test';import assert from 'node:assert/strict';import {pointWKT} from '../location.js';
test('PDOK WKT points preserve axis order and decimals',()=>{assert.deepEqual(pointWKT('POINT(121815.865 487922.335)'),[121815.865,487922.335]);assert.deepEqual(pointWKT('POINT(4.89985889 52.37816541)'),[4.89985889,52.37816541]);assert.throws(()=>pointWKT('POLYGON EMPTY'));});
