import { OpenVidu, OpenViduRole } from 'openvidu-node-client'
import * as express from 'express'
import * as bodyParser from 'body-parser'

const app = express()

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)
app.use(bodyParser.json())
app.use(
  bodyParser.json({
    type: 'application/vnd.api+json',
  }),
)

const OPENVIDU_URL = 'https://open.focusonme.ga'
const OPENVIDU_SECRET = 'MY_SECRET'

// OpenVidu Node Client SDK
var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET)

// 세션 MAP
var mapSessions = {}

// 해당 세션에 존재하는 토큰 리스트
var mapSessionNamesTokens = {}

/**
 * 새로운 토큰을 반환한다.
 * @req.body { session: string; userId: number; }
 */
app.post('/token', function (req, res) {
  const { session: sessionName, userId } = req.body

  // TODO: 회원 토큰 인증을 해야한다.

  // DB 접근해서 계정 정보 확인 후 존재하면 진행

  const serverData = JSON.stringify({ serverData: { userId } })

  console.log('Getting a token | {sessionName}={' + sessionName + '}')

  const connectionProperties = {
    data: serverData,
    role: OpenViduRole.PUBLISHER,
  }

  if (mapSessions[sessionName]) {
    console.log('Existing session ' + sessionName)

    const mySession = mapSessions[sessionName]

    mySession
      .createConnection(connectionProperties)
      .then((connection) => {
        mapSessionNamesTokens[sessionName].push(connection.token)

        res.status(200).send({
          token: connection.token,
          tokensInSession: mapSessionNamesTokens[sessionName],
        })
      })
      .catch((error) => {
        console.error(error)
      })
  } else {
    console.log('New session ' + sessionName)

    OV.createSession()
      .then((session) => {
        mapSessions[sessionName] = session
        mapSessionNamesTokens[sessionName] = []

        session
          .createConnection(connectionProperties)
          .then((connection) => {
            mapSessionNamesTokens[sessionName].push(connection.token)

            res.status(200).send({
              token: connection.token,
              tokensInSession: mapSessionNamesTokens[sessionName],
            })
          })
          .catch((error) => {
            console.error(error)
          })
      })
      .catch((error) => {
        console.error(error)
      })
  }
})

/**
 * 해당 세션의 해당 토큰을 제거한다.
 * @req.body { session: string; token: string; }
 */
app.delete('/token', function (req, res) {
  // TODO: 회원 토큰 인증을 해야한다.

  const { session: sessionName, token } = req.body
  console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + token + '}')

  if (mapSessions[sessionName] && mapSessionNamesTokens[sessionName]) {
    var tokens = mapSessionNamesTokens[sessionName]
    var index = tokens.indexOf(token)

    if (index !== -1) {
      tokens.splice(index, 1)
      console.log(sessionName + ': ' + tokens.toString())
    } else {
      var msg = "Problems in the app server: the TOKEN wasn't valid"
      console.log(msg)
      res.status(500).send(msg)
    }
    if (tokens.length == 0) {
      delete mapSessions[sessionName]
    }
    res.status(200).send()
  } else {
    console.log(msg)
    res.status(500).send(msg)
  }
})

app.listen(3000)
console.log('App listening on port 3000')
