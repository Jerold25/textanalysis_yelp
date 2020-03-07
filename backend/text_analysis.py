import json
import pickle

import gensim as gensim
import nltk
import scipy
import spacy

import numpy as np

# python3 -m spacy download en -> download pretrained models
# from scipy.stats import cosine

from backend.data_dump import load_configuration, get_database_connection
from language_model.encoder import Model


def load_word_embeddings(word2vec_model_file="language_model/data/GoogleNews-vectors-negative300.bin"):
    word2vec_model = gensim.models.KeyedVectors.load_word2vec_format(word2vec_model_file, binary=True)
    return word2vec_model


def cos_sim(a, b):
    """Takes 2 vectors a, b and returns the cosine similarity according
	to the definition of the dot product
	"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)


def get_food_named_entities(review, category_vectors, word2vec_model):
    sent = nltk.word_tokenize(review)
    sent = nltk.pos_tag(sent)

    food_names = []
    for word in sent:
        if "NN" in word[1]:
            if word[0] in word2vec_model:
                word_vec = word2vec_model[word[0]]

                for category_vec in category_vectors:
                    if cos_sim(word_vec, category_vec) > 0.3:
                        food_names.append(word[0])
                        break

    return food_names


def get_named_entities():
    nlp = spacy.load('en')
    review = """I loved this place! Me and my friend came in on a early Friday night and it wasn't too busy! The decor is super cute and cozy!
        We ordered:
        Unagi roll,
        Salmon avocado roll,
        Bistro ramen and beef skewers
        ramen,
        and beef skewers (it was not on the menu but you can ask the serve)

        Everything tasted so good!!! The server was super friendly and attentive! She even gave us complimentary dessert! Will definitely come back!

        - Their seating in the back is DOPE!"""

    review = """It is one of my most favorite restaurants. One, my love for S. Indian deliciousness in general. However, PnC are a valley chain with four locations remaining at this time, IIRC. Thus, I am almost always near one! They offer chicken, goat, paneer and fish cooked in very spicey, flavorful ways. Andhre style, Black pepper, red chili '65', and Ginger. OMG, any one of them is great, but I listed them in my own favorite order. If you combine one of those with a side biryani rice, it's a meal for two. 

    My two fave chaat items are pani puri, and dahi bhatata puri. The first is with mint-water, very light and refreshing. The latter is with yogurt and tamarind...more of a dessert feeling. Either is a refreshing end to a spicey entree. 

    Downside is the lack of veggie options, saag, or palak being my fave. The only constant is a tomatoey stew of potatoes and veggies called Pav Baji. 
    It's not worthy of the entrees."""

    review = """I had samosa chat and a paneer puff. The Samosa chat could've been better. It had only 1 samosa crushed and that was a stale samosa. The whole dish was just sweet and not at all spicy as it is supposed to be a bit spicy too. It was an average dish. The paneer puff was however an excellent starter. My friend had keema Pav and they really liked it. The staff was polite and helpful.

    """
    review = """this place showed up at a perfect time in my life--i had been telling my friends here in tempe how delicious and cool chaat/south asian street food is, and that it's the best place to find "fusion" food, such as curry pizza. then this place showed up in my life and guess what! they have pizza chaat. nice. 

    their samosa is also good. 

    i enjoyed their puffs at one point and was looking forward to trying their vada pav, but as of this time those items are no longer served."""

    # review = """I have to write a raving review for this place because it's been a very long time since I've been
    # blown away by food of this caliber. I tried this place because my girls are away for a month, and I REALLY
    # wanted to try to wait until they came back, because NOBODY can hold a candle to them, but my toes were
    # desperate.  When I went in, they were almost twice what I usually pay to begin with.  Then, before starting the
    #  pedicure, I specifically told them I already had gel polish on my toes.  They didn't tell me right then and
    # there \"that will be an extra $5'.  No, they waited until it was time to pay, and not only charged me for that,
    #  but they charged me all kinds of extra fees that I didn't even ask for!  I had also informed the girl that my
    # toenail was loose and needed gluing.  While I was looking at my phone, all of a sudden I felt this sensation,
    # and she RIPPED OFF MY TOENAIL!!!!  Without even asking me!!!!!!  So then she had another girl come and put
    # acrylic on there since the nail underneath was only 1/2 grown.  Again, they didn't tell me how much this would
    # be, or even ask my permission, they just charged me at the end.  \n\nThe added stone 'massage' was barely a
    # massage!  She rubbed the stones up my lower legs a couple times, and that was it.  It lasted about 30 seconds.
    #   And when I asked for a design, I'm used to getting a board with a bunch of designs to choose from.  She
    # didn't even ask me what I wanted, she just painted a few lines on my two toes and then charge me 5 MORE dollars
    #  for that! \n\nUgh, I don't care HOW ugly my toes look next time, I will NEVER go anywhere else besides Bella
    # Nails again, they ROCK!!!!!!!  This place was appalling.  I didn't want to make a scene, so I just paid the
    # money, but I will NEVER go back!!!!!!!"""

    sent = nltk.word_tokenize(review)
    sent = nltk.pos_tag(sent)

    word2vec_model = load_word_embeddings()

    food_vec = word2vec_model['food']
    category_vec = word2vec_model["Indian"]
    cat1_Vec = word2vec_model["Bakeries"]

    for word in sent:
        if "NN" in word[1]:
            print(word[0])
            if word[0] in word2vec_model:
                word_vec = word2vec_model[word[0]]
                sim_score = cos_sim(food_vec, word_vec)
                print("{}  - {} : {}".format("food", word[0], sim_score))
                if cos_sim(food_vec, word_vec) > 0.3 or cos_sim(category_vec, word_vec) > 0.3 or cos_sim(cat1_Vec,
                                                                                                         word_vec):
                    print("Chosen word  : {}".format(word[0]))

    print(sent)

    doc = nlp(review)

    print(doc.ents)


def get_restuarant_info(db):
    business_ids = json.load(open("backend/data/bussiness_ids.txt"))

    business_id_info_dict = dict()

    for buss_id in business_ids:
        buss_info = db.business.find_one({"business_id": buss_id})
        business_id_info_dict[buss_id] = buss_info

    pickle.dump(business_id_info_dict, open("backend/data/business_id_info_dict.pkl", "wb"))


def get_reviews_for_analysis(db):
    business_ids = json.load(open("backend/data/bussiness_ids.txt"))

    count = 0
    bussiness_id_reviews_dict = dict()
    for id in business_ids:
        reviews = []
        for review in db.review.find({"business_id": id}):
            reviews.append(review)
            count += 1

        bussiness_id_reviews_dict[id] = reviews

    print("Total no. of reviews : {}".format(count))
    pickle.dump(bussiness_id_reviews_dict, open("backend/data/business_id_reviews_dict.pkl", "wb"))


def add_sentiment_info():
    bussiness_id_reviews_dict = pickle.load(open("backend/data/business_id_reviews_dict.pkl", "rb"))

    encoderModel = Model()
    sentiment_lr_model = pickle.load(open("language_model/model/sentiment_logistic_regresion.pkl", "rb"))

    for business_id, reviews in bussiness_id_reviews_dict.items():
        reviews_text = []
        for review in reviews:
            reviews_text.append(review["text"])

        latent_features = encoderModel.transform(reviews_text)

        sentiment_scores = sentiment_lr_model.predict_proba(latent_features)

        for idx in range(len(reviews_text)):
            reviews[idx]["sentiment"] = sentiment_scores[idx].tolist()
            reviews[idx]["lat_rep"] = pickle.dumps(latent_features[idx, :])

    pickle.dump(bussiness_id_reviews_dict, open("backend/data/business_id_reviews_dict.pkl", "wb"))


def get_category_vectors(categories, word2vec_model):
    category_vectors = [word2vec_model["food"]]

    if categories and len(categories) > 0:
        categories = categories.split(",")
        categories = [cat.strip() for cat in categories]

        for category in categories:
            if category in word2vec_model:
                category_vectors.append(word2vec_model[category])

    return category_vectors


def extract_food_items_in_reviews():
    business_id_info_dict = pickle.load(open("backend/data/business_id_info_dict.pkl", "rb"))
    bussiness_id_reviews_dict = pickle.load(open("backend/data/business_id_reviews_dict.pkl", "rb"))
    word2vec_model = load_word_embeddings()

    for buss_id, reviews in bussiness_id_reviews_dict.items():
        buss_info = business_id_info_dict[buss_id]

        category_vectors = get_category_vectors(buss_info["categories"], word2vec_model)

        for review in reviews:
            review["food_items"] = get_food_named_entities(review["text"], category_vectors, word2vec_model)

    pickle.dump(bussiness_id_reviews_dict, open("backend/data/business_id_reviews_dict.pkl", "wb"))


def dump_sentiment_info(db):
    business_id_info_dict = pickle.load(
        open("backend/data/text_analysis_results/sentiment/business_id_reviews_dict.pkl", "rb"))
    for buss_id, reviews in business_id_info_dict.items():
        for review in reviews:
            db.sentiment_info.insert(review)


def dump_food_items_info(db):
    business_id_info_dict = pickle.load(
        open("backend/data/text_analysis_results/food_extract/business_id_reviews_dict.pkl", "rb"))
    for buss_id, reviews in business_id_info_dict.items():
        for review in reviews:
            db.food_items_info.insert(review)


def fix_sentiment_issue(db):
    for review in db.sentiment_info.find():


        print(review)



if __name__ == "__main__":
    config = load_configuration("backend/project.config")
    db = get_database_connection(config)

    fix_sentiment_issue(db)

    # dump_sentiment_info(db)
    # dump_food_items_info(db)

    # get_reviews_for_analysis(db)

    # get_restuarant_info(db)

    # add_sentiment_info()
    # extract_food_items_in_reviews()

    # business_id_info_dict = pickle.load(
    #     open("backend/data/text_analysis_results/sentiment/business_id_reviews_dict.pkl", "rb"))
    # for buss_id, reviews in business_id_info_dict.items():
    #     for review in reviews:
    #         print(review)
    # del review["lat_rep"]

    # print(len(business_id_info_dict))

    # get_named_entities()

    # word2vec_model = load_word_embeddings()
    # food_vector = word2vec_model["food"]
    # similar_words = word2vec_model.most_similar(positive=["food"], topn=100)

    # print(similar_words)
