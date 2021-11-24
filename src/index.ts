import express from 'express';
import expressWs from 'express-ws';

const {app, getWss} = expressWs(express());

const router = express.Router() as expressWs.Router;

interface DB {
  id: string,
  users: User[] | []
}


interface User {
  id: string,
  choice: string | null
}

const db: DB[] = [
  {
    id: '1',
    users: []
  },
  {
    id: '2',
    users: []
  },
  {
    id: '3',
    users: []
  },
]

// interface WS {
//   on: (type: string, data: (data: string) => void) => void;
// }


router.ws('/connect', (ws) => {
  let user_id = ''
  let user_room = ''
  let room_id = ''
  ws.on('message', (msg: string) => {
    const {type, data} = JSON.parse(msg)
    if (data.user_id) {
      user_id = data.user_id
    }

    switch (type) {
      case 'message' : {
        // getWss().clients.forEach(client => {
        //   client.send(`Message from ${req.params.username}: ${data.message}`)
        // })
        break
      }
      case 'connect': {

        let success = false

        db.forEach((room) => {
          if (room.id === data.room) {
            success = true
            room.users.push({
              // @ts-ignore
              id: data.user_id,
              // @ts-ignore
              choice: null
            })
            getWss().clients.forEach(client => {
              client.send(JSON.stringify({
                type: 'greeting',
                message: `${data.username} connected`
              }))
            })
          }
        })


        if (success) {
          user_room = data.room
          ws.send(JSON.stringify({
            type: "connect",
            status: "success",
            ...data
          }))


        } else {
          ws.send(JSON.stringify({
            type: 'connect',
            connect: 'none'
          }))
        }
        break
      }
      case 'create': {
        db.push({
          id: data.room,
          users: []
        })
        ws.send(JSON.stringify({
          type: "create",
          status: "success",
          ...data
        }))
        break
      }
      case 'choice': {
        db.forEach((room) => {
          if (room.id === data.room) {
            const tempUsers: User[] = []
            let send:boolean = false
            room.users.forEach((user) => {
              tempUsers.push({
                id: user.id,
                choice: null
              })
              if(user.choice && user.id !== data.user_id){
                send = true
                getWss().clients.forEach(client => {
                  if(client === ws){
                    client.send(JSON.stringify({
                      type: 'choice',
                      data: {
                        me: data.choice,
                        enemy: user.choice
                      }
                    }))
                  }else{
                    client.send(JSON.stringify({
                      type: 'choice',
                      data: {
                        me: user.choice,
                        enemy: data.choice
                      }
                    }))
                  }
                })
              }else {
                if(user.id === data.user_id){
                  user.choice = data.choice
                  ws.send(JSON.stringify({
                    type: 'choose',
                  }))
                }
              }

            })
            if(send){
              room.users = tempUsers
            }
          }
        })
        break
      }
    }
  });
  ws.on('close', () => {
    db.forEach((room, index) => {
      if (room.id === user_room || room.id === room_id) {
        if (room.users.length < 2) {
          db.splice(index, 1)
        } else {
          room.users.forEach((user, index) => {
            if (user.id === user_id) {
              room.users.splice(index, 1)
            }
          })
        }
      }
    })
  })


});

// router.ws('/room/:id', (ws, req,next) => {
//
// })


app.use('/app', router)

app.listen(5000, () => console.log('Server Started!'));