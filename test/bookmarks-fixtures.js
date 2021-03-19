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

module.exports = {
    makeBookmarksArray,
}