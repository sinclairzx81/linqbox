import { linq } from '@sinclair/linqbox'

const users = [
  { userid: 0, name: 'dave' },
  { userid: 1, name: 'bob' },
  { userid: 2, name: 'alice' },
  { userid: 3, name: 'roger' },
]
const records = [
  { recordid: 0, userid: 0, data : 'toaster' },
  { recordid: 1, userid: 2, data : 'fridge' },
  { recordid: 2, userid: 1, data : 'television' },
  { recordid: 3, userid: 4, data : 'toaster' },
  { recordid: 4, userid: 2, data : 'stove' },
  { recordid: 5, userid: 0, data : 'couch' },
  { recordid: 6, userid: 2, data : 'computer' },
  { recordid: 7, userid: 2, data : 'washing machine' },
  { recordid: 8, userid: 3, data : 'remote control' },
  { recordid: 9, userid: 1, data : 'air conditioner' },
]

const query = linq `
  from user in ${users}
  join record in ${records}
    on user.userid equals record.userid 
      into records
  select {
    user,
    records
  }`

for(const value of query) {
  console.log(value)
}
