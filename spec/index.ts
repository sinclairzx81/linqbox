import { linq } from '@sinclair/linqbox'

const users = [
    { userid: 0, firstname: 'dave', lastname: 'smith' },
    { userid: 1, firstname: 'smith', lastname: 'rogers' },
    { userid: 2, firstname: 'jones', lastname: 'edgar' },
    { userid: 3, firstname: 'alice', lastname: 'jenkins' }
]

const query = linq`
    from user in ${users} 
    where user.userid > 1
    const fullname = [
        user.firstname, 
        user.lastname
    ].join(' ')
    orderby user.firstname
    select { 
        ...user, 
        fullname
    }`

for (const user of query) {
    console.log(user)
}