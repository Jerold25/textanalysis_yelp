
import string
import time

import bson
from collections import OrderedDict
import datetime
from bson.json_util import dumps, loads

from flask import Flask, redirect, url_for
from flask import jsonify
from flask import request, make_response
from flask_pymongo import PyMongo
from flask_cors import CORS

from werkzeug.contrib.cache import SimpleCache

app = Flask(__name__)

cors = CORS(app)

cache = SimpleCache()

app.config['MONGO_DBNAME'] = 'yelp-db'
app.config['MONGO_URI'] = 'mongodb://localhost:27017/yelp-db'

mongo = PyMongo(app)

from escapejson import escapejson


@app.route('/get-data', methods=['GET'])
def get_resturant_info():
    res = []
    try:

        mile = 3963

        # Retrieve 1000 businesses from the center of Tempe -> nearest to the farthest
        x = mongo.db.business.find({"location": {"$nearSphere": [-111.9400, 33.4255], "$minDistance": 0 / mile}}).limit(
            1000)

        for i in x:
            temp = {'type': "Feature"}
            props = {'city': i['city'], 'review_count': i['review_count'], 'name': i['name'],
                     'business_id': i['business_id'], 'hours': i['hours'], 'state': i['state'],
                     'postal_code': i['postal_code'], 'stars': i['stars'], 'address': i['address'],
                     'is_open': i['is_open'], 'attributes': i['attributes'], 'categories': i['categories']}
            temp['properties'] = props
            geo = {'type': 'Point', 'coordinates': i['location']}
            temp['geometry'] = geo

            res.append(temp)

    except Exception as ex:
        print(ex)

    return make_response(dumps(res))


@app.route('/', methods=['GET'])
def start():
    return redirect(url_for('get_all_details'))


def get_liveliness(business_id):
    obj = mongo.db.checkin.find_one({"business_id": business_id})
    date_str = obj['date']
    dates = date_str.split(', ')
    data = []

    heat_map = [[0 for i in range(24)] for j in range(7)]
    date_map = {0: set(), 1: set(), 2: set(), 3: set(), 4: set(), 5: set(), 6: set()}
    for i in dates:
        date, time = i.split(' ')
        day = int(datetime.datetime.strptime(date, '%Y-%m-%d').strftime('%w'))
        date_map[day].add(date)
        hour = int(time.split(':')[0])
        heat_map[day][hour] += 1

    for i in range(7):
        for j in range(24):
            x = len(date_map[i])
            if x>1:
                heat_map[i][j] /= x
            data.append(OrderedDict([('day', i), ('hour', j), ('value', heat_map[i][j])]))

    return data


@app.route('/all-details', methods=['GET'])
def get_all_details():
    # args = request.args
    # business_id = args["business-id"]
    business_id = "mKf7pIkOYpEhJTqjw4_Fxg"
    response = cache.get(business_id)

    if not response:
        word_cloud_data = get_word_cloud_trend(business_id)
        rating_trend_data = get_rating_trend(business_id)
        sentiment_trend_data = get_sentiment_trend(business_id)
        liveliness = get_liveliness(business_id)
        combined_trend = get_combined_trend(business_id)


        response = {"ratingTrend": rating_trend_data, "sentimentTrend": sentiment_trend_data,
                    "liveliness": liveliness,
                    "wordCloudData":
                        word_cloud_data, "combinedTrends": combined_trend}

        cache.set(business_id, response, timeout=15 * 60)

    return make_response(escapejson(dumps(response)))


# @app.route('/rating_trend', methods=['GET'])
def get_rating_trend(business_id):
    cursor = mongo.db.review.aggregate(
        [
            {"$match": {"business_id": business_id}},
            {'$project': {'part_date': {'$substr': ['$date', 0, 7]}, 'stars': '$stars', 'business_id': '$business_id'}},
            {"$group": {"_id": '$part_date', "avgRating": {"$avg": '$stars'}}},
            {"$sort": {"_id": 1}}
        ]
    )
    data = []
    c = 0
    cum = 0
    for i in cursor:
        val = (cum * c) + i['avgRating']
        c = c + 1
        cum = val / c

        data.append({'date': i['_id'], 'count': cum})

    return data


def get_sentiment_trend(business_id):
    cursor = mongo.db.sentiment_info.aggregate(
        [
            {"$match": {"business_id": business_id}},
            {'$project': {'part_date': {'$substr': ['$date', 0, 7]},
                          'pos_sentiment': {'$arrayElemAt': ["$sentiment", 1]}, 'business_id': 1}},
            {"$group": {"_id": '$part_date', "avgSenti": {"$avg": '$pos_sentiment'}}},
            {"$sort": {"_id": 1}}
        ]
    )

    data = []
    c = 0
    cum = 0
    for i in cursor:
        val = (cum * c) + i['avgSenti']
        c = c + 1
        cum = val / c

        data.append({'date': i['_id'], 'count': cum})

    return data

def get_combined_trend(business_id):
    #SENTIMENTS
    cursor = mongo.db.sentiment_info.aggregate(
        [
            {"$match": {"business_id": business_id}},
            {'$project': {'part_date': {'$substr': ['$date', 0, 10]},
                          'pos_sentiment': {'$arrayElemAt': ["$sentiment", 1]}, 'business_id': 1}},
            {"$group": {"_id": '$part_date', "avgSenti": {"$avg": '$pos_sentiment'}}},
            {"$sort": {"_id": 1}}
        ]
    )

    sentiments = {}
    c = 0
    cum = 0
    for i in cursor:
        val = (cum * c) + i['avgSenti']
        c = c + 1
        cum = val / c

        dat = i['_id']
        date_time_obj = time.strptime(dat, "%Y-%m-%d")
        epoch = int(time.mktime(date_time_obj))
        sentiments[epoch] = cum

    #RATINGS
    cursor = mongo.db.review.aggregate(
        [
            {"$match": {"business_id": business_id}},
            {'$project': {'part_date': {'$substr': ['$date', 0, 10]}, 'stars': '$stars',
                          'business_id': '$business_id'}},
            {"$group": {"_id": '$part_date', "avgRating": {"$avg": '$stars'}}},
            {"$sort": {"_id": 1}}
        ]
    )
    rating = {}
    c = 0
    cum = 0
    for i in cursor:
        val = (cum * c) + i['avgRating']
        c = c + 1
        cum = val / c

        dat = i['_id']
        date_time_obj = time.strptime(dat, "%Y-%m-%d")
        epoch = int(time.mktime(date_time_obj))
        rating[epoch] = cum

    trend = []
    for key, val in rating.items():
        senti = 0
        if key in sentiments:
            senti = sentiments[key] * 5
        temp = {'date': key, 'ratings': val, 'sentiment': senti}
        trend.append(temp)

    return trend


# @app.route('/word-cloud-trend', methods=['GET'])
def get_word_cloud_trend(business_id):
    # args = request.args
    # restuarant_id = args["resturant-id"]

    word_value_dict = dict()

    word_reviews_dict = dict()

    for review in mongo.db.food_items_info.find({"business_id": business_id}):
        for word in review["food_items"]:
            word = escape_keys(word)
            if word not in word_value_dict:
                word_value_dict[word] = 0

            if word not in word_reviews_dict:
                word_reviews_dict[word] = []

            word_value_dict[word] = word_value_dict[word] + review["stars"]
            if len(word_reviews_dict[word]) < 10:
                word_reviews_dict[word].append({"text": escape_quotes(review["text"]), "stars": review["stars"], "date": review["date"]})

    # words = []
    # for word, value in word_value_dict.items():
    #     words.append({"text": word, "weight": value})

    sample_title = {}

    for word, count in word_value_dict.items():
        sample_title[word] = "Got {} stars!".format(count)

    response = {"count": word_value_dict, "sample_title": sample_title, "word_reviews":word_reviews_dict }

    return response


def remove_punctuations(text):
    return str(text).translate(str.maketrans('', '', string.punctuation))


def escape_keys(text):
    text = text.lower()
    return remove_punctuations(text)


def escape_quotes(text):
    text = text.replace('"', '\"')
    return text


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5001)
