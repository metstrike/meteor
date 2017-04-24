// Wrap a transform function to return objects that have the _id field
// of the untransformed document. This ensures that subsystems such as
// the observe-sequence package that call `observe` can keep track of
// the documents identities.
//
// - Require that it returns objects
// - If the return value has an _id field, verify that it matches the
//   original _id field
// - If the return value doesn't have an _id field, add it back.
var global = Function('return this')();
var _ = require('underscore');
var Immutable = require('immutable');
var EJSON = require('metstrike-ejson');
var Tracker = require('metstrike-tracker');

var setWrapTransform = function (LocalCollection) {

LocalCollection.wrapTransform = function (transform) {
  if (! transform)
    return null;

  // No need to doubly-wrap transforms.
  if (transform.__wrappedTransform__)
    return transform;

  var wrapped = function (doc) {
    if (!doc.has('_id')) {
      // XXX do we ever have a transform on the oplog's collection? because that
      // collection has no _id.
      throw new Error("can only transform documents with _id");
    }

    var id = doc.get('_id');
    // XXX consider making tracker a weak dependency and checking Package.tracker here
    var transformed = Tracker.nonreactive(function () {
      return transform(doc);
    });

    if (!isPlainObject(transformed)) {
      throw new Error("transform must return object");
    }

    if (transformed.has('_id')) {
      if (!Immutable.is(transformed.get('_id'), id)) {
        throw new Error("transformed document can't have different _id");
      }
    } else {
      transformed = transformed.set('_id', id);
    }
    return transformed;
  };
  wrapped.__wrappedTransform__ = true;
  return wrapped;
};
}

if(global.LocalCollection){setWrapTransform(global.LocalCollection);}

module.exports = setWrapTransform;
