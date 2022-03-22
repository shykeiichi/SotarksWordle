var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/willmexe/carlssonswordle.git', // Update to point to your repository  
        user: {
            name: 'willmexe', // update to use your name
            email: 'imdark200@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)