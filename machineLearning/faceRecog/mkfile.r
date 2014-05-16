FLAGS = -std=c++11 -O3

H = $(wildcard *.h)
C = $(wildcard *.cpp)
app:  $(H) $(C) 
	g++ $(FLAGS) -Wall -I/usr/include/python2.7 $(H) $(C) -lpthread -lpython2.7


