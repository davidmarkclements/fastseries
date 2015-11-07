/*eslint handle-callback-err: 0 */
var test = require('tape')
var series = require('./')

test('basically works', function (t) {
  t.plan(8)

  var instance = series({
    released: released
  })
  var count = 0
  var obj = {}

  instance(obj, [build(0), build(1)], 42, function done () {
    t.equal(count, 2, 'all functions must have completed')
  })

  function build (expected) {
    return function something (state, arg, cb) {
      t.equal(obj, state)
      t.equal(arg, 42)
      t.equal(expected, count)
      setImmediate(function () {
        count++
        cb()
      })
    }
  }

  function released () {
    t.pass()
  }
})

test('accumulates results', function (t) {
  t.plan(8)

  var instance = series({
    released: released
  })
  var count = 0
  var obj = {}

  instance(obj, [something, something], 42, function done (err, state, results) {
    t.notOk(err, 'no error')
    t.equal(count, 2, 'all functions must have completed')
    t.deepEqual(results, [1, 2])
  })

  function something (state, arg, cb) {
    t.equal(obj, state)
    t.equal(arg, 42)
    setImmediate(function () {
      count++
      cb(null, count)
    })
  }

  function released () {
    t.pass()
  }
})

test('fowards errs', function (t) {
  t.plan(4)

  var instance = series({
    released: released
  })
  var count = 0
  var obj = {}

  instance(obj, [somethingErr, something], 42, function done (err, results) {
    t.ok(err, 'error exists')
    t.equal(err.message, 'this is an err!')
    t.equal(count, 1, 'only the first function must have completed')
  })

  function something (state, arg, cb) {
    setImmediate(function () {
      count++
      cb(null, count)
    })
  }

  function somethingErr (state, arg, cb) {
    setImmediate(function () {
      count++
      cb(new Error('this is an err!'))
    })
  }

  function released () {
    t.pass()
  }
})

test('does not forward errors or result with results:false flag', function (t) {
  t.plan(8)

  var instance = series({
    released: released,
    results: false
  })
  var count = 0
  var obj = {}

  instance(obj, [something, something], 42, function done (err, state, results) {
    t.equal(err, undefined, 'no err')
    t.equal(results, undefined, 'no err')
    t.equal(count, 2, 'all functions must have completed')
  })

  function something (state, arg, cb) {
    t.equal(obj, state)
    t.equal(arg, 42)
    setImmediate(function () {
      count++
      cb()
    })
  }

  function released () {
    t.pass()
  }
})

test('should call done and released if an empty is passed', function (t) {
  t.plan(2)

  var instance = series({
    released: released
  })
  var obj = {}

  instance(obj, [], 42, function done () {
    t.pass()
  })

  function released () {
    t.pass()
  }
})

test('each support', function (t) {
  t.plan(8)

  var instance = series({
    released: released
  })
  var count = 0
  var obj = {}
  var args = [1, 2, 3]
  var i = 0

  instance(obj, something, [].concat(args), function done () {
    t.equal(count, 3, 'all functions must have completed')
  })

  function something (state, arg, cb) {
    t.equal(obj, state, 'this matches')
    t.equal(args[i++], arg, 'the arg is correct')
    setImmediate(function () {
      count++
      cb()
    })
  }

  function released () {
    t.pass()
  }
})

test('call the callback with the given state', function (t) {
  t.plan(1)

  var instance = series()
  var obj = {}

  instance(obj, [build(), build()], 42, function done (err, state) {
    t.equal(obj, state, 'state matches')
  })

  function build () {
    return function something (state, arg, cb) {
      setImmediate(cb)
    }
  }
})

test('call the callback with the given this with no results', function (t) {
  t.plan(1)

  var instance = series({ results: false })
  var obj = {}

  instance(obj, [build(), build()], 42, function done (err, state) {
    t.equal(obj, state, 'state matches')
  })

  function build () {
    return function something (state, arg, cb) {
      setImmediate(cb)
    }
  }
})

test('call the callback with the given state with no data', function (t) {
  t.plan(1)

  var instance = series()
  var obj = {}

  instance(obj, [], 42, function done (err, state) {
    t.equal(obj, state, 'state matches')
  })
})

test('support no final callback', function (t) {
  t.plan(6)

  var instance = series()
  var count = 0
  var obj = {}

  instance(obj, [build(0), build(1)], 42)

  function build (expected) {
    return function something (state, arg, cb) {
      t.equal(obj, state)
      t.equal(arg, 42)
      t.equal(expected, count)
      setImmediate(function () {
        count++
        cb()
      })
    }
  }
})
