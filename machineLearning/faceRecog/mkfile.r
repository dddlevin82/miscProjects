FLAGS = -std=c++11 

H = $(wildcard *.h)
C = $(wildcard *.cpp)
app:  $(H) $(C) 
	g++ $(FLAGS) -Wall -I/usr/include/python2.7 $(H) $(C) -lpython2.7


