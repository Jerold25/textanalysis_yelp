import configparser
import json
from collections import Counter
import pickle


from tqdm import tqdm
from pymongo import MongoClient, ASCENDING


def load_configuration(config_file):
    """Gets the configuration file and returns the dictionary of configuration"""
    filename = config_file
    config = configparser.ConfigParser()
    config.read(filename)

    return config


def get_database_connection(config):
    host = config['MongoDB']['host']
    port = int(config['MongoDB']['port'])
    db_name = config['MongoDB']['database_name']

    client = MongoClient(host, port)
    db = client[db_name]
    return db


def remove_business_by_state(db, state_code):
    db.business.remove({"state": {"$ne": state_code}})


def get_distinct_business_ids(db):
    return set(db.business.distinct("business_id"))


def dump_business(db, dataset_dir, state_choice):
    print("Dumping business data ...")

    states = []
    with open("{}/business.json".format(dataset_dir), encoding="UTF-8") as file:
        for line in tqdm(file):
            business_object = json.loads(line)
            states.append(business_object["state"])
            # if business_object["state"] == state_choice:
            #     business_object["location"] = [business_object["longitude"], business_object["latitude"]]
            #     db.business.insert(business_object)

    count_dict = Counter(states)
    print(count_dict.items())
    # crete geo spatial index on the location field
    # TODO: Create indexes on fields requiring filter query
    # db.business.create_index([("location", "2d"), ("business_id", ASCENDING)])


def dump_checkins(db, dataset_dir):
    filtered_business_ids = get_distinct_business_ids(db)
    print("Dumping user checkins ...")

    with open("{}/checkin.json".format(dataset_dir)) as file:
        for line in tqdm(file):
            checkin_object = json.loads(line)
            if checkin_object["business_id"] in filtered_business_ids:
                db.checkin.insert(checkin_object)


def dump_reviews(db, dataset_dir):
    filtered_business_ids = get_distinct_business_ids(db)
    print("Dumping user reviews ...")
    with open("{}/review.json".format(dataset_dir)) as file:
        for line in tqdm(file):
            review_object = json.loads(line)
            if review_object["business_id"] in filtered_business_ids:
                db.review.insert(review_object)


def dump_sentiment_info(db):
    business_id_info_dict = pickle.load(
        open("./data/text_analysis_results/sentiment/business_id_reviews_dict.pkl", "rb"))
    for buss_id, reviews in business_id_info_dict.items():
        for review in reviews:
            db.sentiment_info.insert(review)


def dump_food_items_info(db):
    business_id_info_dict = pickle.load(
        open("./data/text_analysis_results/food_extract/business_id_reviews_dict.pkl", "rb"))
    for buss_id, reviews in business_id_info_dict.items():
        for review in reviews:
            db.food_items_info.insert(review)



if __name__ == "__main__":
    config = load_configuration("project.config")
    db = get_database_connection(config)

    dataset_location = ""

    state_choice = "AZ"

    # remove_business_by_state(db, state_choice)

    # dump_business(db, dataset_location, state_choice)
    #
    #
    # dump_checkins(db, dataset_location)
    # dump_reviews(db, dataset_location)

    dump_sentiment_info(db)
    dump_food_items_info(db)
