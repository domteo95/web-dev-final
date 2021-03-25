from flask import Flask, render_template, request, jsonify
from functools import wraps
import mysql.connector
import bcrypt
import configparser
import io
import random
from datetime import datetime
from datetime import timedelta
import string

config = configparser.ConfigParser()
config.read('secrets.cfg')
DB_NAME = 'dominicteo'
DB_USERNAME = config['secrets']['DB_USERNAME']
DB_PASSWORD = config['secrets']['DB_PASSWORD']
PEPPER = config['secrets']['PEPPER']

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

posts = [
    {
        "id": 0,
        "title": "Hello World!",
        "body": "This is my first post and I'm so proud of it."
    }
]

@app.route('/')
@app.route('/auth')
@app.route('/list')
@app.route('/channel-list')
@app.route('/channel')
@app.route('/thread')
def index(chat_id=None, name=None):
    return app.send_static_file('index.html')

# -------------------------------- API ROUTES ----------------------------------

@app.route('/api/signup', methods=['POST'])
def signup ():
    body = request.get_json()
    print(body)

    email = body['email']
    display = body['display_name']
    password = (body['password']+PEPPER).encode('utf-8')
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    token = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "INSERT into users (email, display_name, password, session_token) VALUES (%s, %s, %s, %s)"
    query2 = "SELECT id from users WHERE email = %s AND password = %s"

    query3 = "SELECT channel_id from channels"
    query4 = "INSERT INTO unread(channel_id, user_id) VALUES"

    try:
        print(query, token, 'CHECKING token value')
        cursor.execute(query, (email, display, hashed, token))
        cursor.execute(query2, (email, hashed))
        rv = cursor.fetchone()
        user_id = rv[0]
        cursor.execute(query3)
        channel_ids = [item[0] for item in cursor.fetchall()]
        for channel in channel_ids:
            query4 += "(%d, %d), " % (channel, user_id)
        if len(channel_ids) > 0:
            cursor.execute(query4[:-2])
        connection.commit()
        return {'session_token': token, 'user_id': user_id, 'display':display}, 200
    except Exception as e:
        return {"email": email}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/login', methods=['POST'])
def login ():
    body = request.get_json()
    print(body)

    email = body['email']
    password = body['password']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "SELECT password, display_name, id FROM users WHERE email=%s"
    query2 = "UPDATE users set session_token=%s where id=%s"
    token = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))

    try:
        cursor.execute(query, (email,))
        hashed, display, id = cursor.fetchone()
        if bcrypt.checkpw((password+PEPPER).encode('utf-8'), hashed.encode('utf-8')):
            cursor.execute(query2, (token, id))
            connection.commit()
            return {'session_token': token, 'display_name': display, 'id': id}, 200
        return {}, 404
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/update-email', methods=['POST'])
def updateEmail ():
    body = request.get_json()
    print(body)

    email = body['email']
    id = body['id']
    token = body['token']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "UPDATE users set email=%s where id=%s"
    token_query = "select session_token from users where id = %s"

    try:
        cursor.execute(token_query, (id,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            print('session_token is good!')
            cursor.execute(query, (email,id))
            connection.commit()
            return {}, 200
        else:
            return {}, 500

    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/update-display', methods=['POST'])
def updateDisplay ():
    body = request.get_json()
    print(body)

    display = body['display_name']
    id = body['id']


    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "UPDATE users set display_name=%s where id=%s"
    query2 = "UPDATE messages set user=%s where user_id=%s"
    token = body['token']
    token_query = "select session_token from users where id = %s"

    try:
        cursor.execute(token_query, (id,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (display,id))
            cursor.execute(query2, (display,id))
            connection.commit()
            print('session_token is good!')
            return {}, 200
        else:
            return {}, 500

    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/update-unread', methods=['POST'])
def updateUnread ():
    body = request.get_json()
    print(body)

    channel = body['channelID']
    user = body['userID']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "update unread set last_read_id = (select max(id) from messages where channel_id = %s) where user_id = %s and channel_id = %s"
    token = body['token']
    token_query = "select session_token from users where id = %s"
    try:
        cursor.execute(token_query, (user,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (channel, user, channel))
            connection.commit()
            return {}, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/change-password', methods=['POST'])
def changePassword ():
    body = request.get_json()
    print(body)

    current = body['current']
    new_password = (body['new']+PEPPER).encode('utf-8')
    new_hashed = bcrypt.hashpw(new_password, bcrypt.gensalt())
    id = body['id']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    query = "select password from users where id=%s"
    query2 = "UPDATE users set password=%s where id=%s"
    token = body['token']
    token_query = "select session_token from users where id = %s"

    try:
        cursor.execute(token_query, (id,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (id,))
            hashed = cursor.fetchone()[0]
            if bcrypt.checkpw((current+PEPPER).encode('utf-8'), hashed.encode('utf-8')):
                print('current password matches')
                cursor.execute(query2, (new_hashed,id))
                connection.commit()
                return {}, 200
            else:
                return {}, 401
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/channel-list', methods=['POST'])
def channelList ():
    body = request.get_json()
    userID = body['user']
    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "select * from channels"
    query2 = "select count(*) from messages where channel_id = %s and post_id is NULL and id > (select last_read_id from unread where channel_id = %s and user_id = %s)"
    token = body['token']
    token_query = "select session_token from users where id = %s"

    results = {}
    try:
        cursor.execute(token_query, (userID,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query)
            rv = cursor.fetchall()
            for channel in rv:
                cursor.execute(query2, (channel[0], channel[0], userID))

                unread = cursor.fetchone()[0]
                results[channel[0]]  = [channel[1], channel[2], unread]
            return results, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/create-channel', methods=['POST'])
def createChannel ():
    body = request.get_json()
    print(body)

    name = body['name']
    user = body['user']


    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "INSERT into channels (name, user_id) values (%s, %s)"
    query2 = "SELECT channel_id from channels where name = %s and user_id = %s"
    query3 = "SELECT id from users;"
    query4 = "INSERT INTO unread(channel_id, user_id) VALUES"
    token = body['token']
    token_query = "select session_token from users where id = %s"

    results = {}

    try:
        cursor.execute(token_query, (user,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (name, user))
            cursor.execute(query2, (name, user))
            channel_id = cursor.fetchone()[0]

            cursor.execute(query3)
            print('here3')
            user_ids = [item[0] for item in cursor.fetchall()]
            for user in user_ids:
                query4 += "(%d, %d), " % (channel_id, user)
            cursor.execute(query4[:-2])
            print('here4')
            connection.commit()
            return {}, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/delete-channel', methods=['POST'])
def deleteChannel ():
    body = request.get_json()
    print(body)

    channel = body['channel_id']
    user = body['user_id']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "SELECT user_id from channels where channel_id = %s"
    query2 = "DELETE from channels where channel_id = %s"


    try:
        cursor.execute(query, (channel,))
        rv = cursor.fetchone()
        correct_user = rv[0]
        if correct_user == int(user):
            cursor.execute(query2, (channel,))
            print('correct user')
            connection.commit()
            return {}, 200
        else:
            return {}, 401
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/post-message', methods=['POST'])
def postMessage ():
    body = request.get_json()
    print(body)

    channelID = body['channel']
    user = body['user']
    userID = body['userID']
    message = body['message']


    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "INSERT into messages (channel_id, message, user, user_id) values (%s, %s, %s, %s)"
    token = body['token']


    token_query = "select session_token from users where id = %s"

    try:
        cursor.execute(token_query, (userID,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (channelID, message, user, userID))
            connection.commit()
            return {}, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/reply-thread', methods=['POST'])
def replyThread ():
    body = request.get_json()
    print(body)

    channelID = body['channel']
    user = body['user']
    userID = body['userID']
    message = body['message']
    postID = body['postID']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "INSERT into messages (channel_id, post_id, message, user, user_id) values (%s, %s, %s, %s, %s)"
    token = body['token']
    token_query = "select session_token from users where id = %s"

    try:
        cursor.execute(token_query, (userID,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (channelID, postID, message, user, userID))
            connection.commit()
            return {}, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/get-messages', methods=['POST'])
def getMessages ():
    body = request.get_json()
    print(body)

    channelID = body['channel']
    user = body['user']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "select id, message, user from messages where post_id is null and channel_id = %s"
    token = body['token']
    token_query = "select session_token from users where id = %s"

    results = {}

    try:
        cursor.execute(token_query, (user,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (channelID, ))
            rv = cursor.fetchall()
            for channel in rv:
                results[channel[0]]  = [channel[1], channel[2]]
            return results, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/get-replies', methods=['POST'])
def getReplies ():
    body = request.get_json()
    print(body)

    postID = body['post']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "select count(*) from messages where post_id = %s"
    user = body['user']
    token = body['token']
    token_query = "select session_token from users where id = %s"

    results = {}

    try:
        cursor.execute(token_query, (user,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (postID, ))
            rv = cursor.fetchone()
            results['replies'] = rv[0]
            return results, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()

@app.route('/api/fetch-replies', methods=['POST'])
def fetchReplies ():
    body = request.get_json()

    channelID = body['channel']
    postID = body['post']
    user = body['user']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    query = "select id, user, message from messages where post_id = %s and channel_id = %s"
    token = body['token']
    token_query = "select session_token from users where id = %s"
    results = {}

    try:
        cursor.execute(token_query, (user,))
        db_token = cursor.fetchone()[0]
        if token == db_token:
            cursor.execute(query, (postID, channelID))
            rv = cursor.fetchall()
            for channel in rv:
                results[channel[0]]  = [channel[1], channel[2]]
            return results, 200
        else:
            return {}, 500
    except Exception as e:
        print(e)
        return {}, 302
    finally:
        cursor.close()
        connection.close()
