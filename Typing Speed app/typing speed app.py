import random
import time

words = []
letters = []
user_letters = []
user_words = []

with open("typing_tests.txt", "r") as file:
    intro = int(input("Welcome to the typing speed test! How many words would you like to type? "))
    i = intro
    
    content = file.read().strip(",").split(" ")
    randword = random.randint(0, len(content)-1)
    print(content[:i])
    
    j = len(words)-1
    for word in content[:i]:
        words.append(word)
        for letter in words[j]:
            letters.append(letter)

    user_input = input("Now, you type these words! ")
    split_input = user_input.split(" ")  
    
    k = len(user_words)-1
    for word in split_input:
        user_words.append(word)
        for letterz in user_words[k]:
            user_letters.append(letterz)

    start_time = time.time()
    end_time = time.time()
    total_time = end_time - start_time
    if total_time == 60:
        print("Time's up!")

def check_correct():
    l = 0
    wrong_counter = 0
    if range(max(len(user_letters)) != max(len(letters))):
        wrong_counter +- int(max(len(user_letters)) - (max(len(letters))))
    for l in range(len(user_letters)):
        if user_input:
            if user_letters[l] != letters[l]:
                wrong_counter += 1
        elif user_letters[l] == letters[l]:
            print("You got them all right!")
            
        else:
            print("You didn't type anything!")
    print(f"You got {wrong_counter} letters wrong!")

   


check_correct()
        


    
    

    
    





