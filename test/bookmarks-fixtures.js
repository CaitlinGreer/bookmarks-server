function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Bloc',
            url: 'https://www.bloc.com',
            description: 'Now thinkful',
            rating: 5,
          },
          {
            id: 2,
            title: 'Amazon',
            url: 'https://www.amazon.com',
            description: 'Where we purchase all the things',
            rating: 4,
          },
          {
            id: 3,
            title: 'MDN',
            url: 'https://developer.mozilla.org',
            description: 'Web docs for all',
            rating: 5,
          },
    ]
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    rating: 1,
    url: 'ww.not-a-real.website',
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">.',
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist">.'
  }
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}