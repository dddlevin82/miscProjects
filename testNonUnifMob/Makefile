FLAGS = -std=c++11 -Wall -O3 #-fopenmp -Wall# -O3 
CC = g++
PYLINK = -lpython2.7
FFTWLINK = -lfftw3 -lm
APATH = ../../analysis3d/

H = $(wildcard *.h) $(wildcard $(APATH)*.h)
SRCS = $(wildcard *.cpp) $(wildcard $(APATH)*.cpp)

OBJS = $(SRCS:.cpp=.cpp.o)
$(info Serial result = $(OBJS))
$(info Serial result = $(H))

main: $(OBJS) 
	$(CC) $(FLAGS) $(OBJS) -I/usr/include/python2.7 -I/usr/include/ -I$(APATH) $(PYLINK) $(FFTWLINK) -o a.out

#main: $(SRCS) $(H)
#	g++ $(FLAGS) $(SRCS) $(H) -I/usr/include/python2.7 -I$(APATH) -lpython2.7 -o a.out
%.cpp.o: %.cpp
	$(CC) $(FLAGS) -c -o $@ $< $(PYLINK) $(FFTWLINK) -I/usr/include/python2.7 -I/usr/include/ -I$(APATH)
clean:
	rm *.cpp.o
	rm /home/daniel/Documents/2dGlass/code/analysis3d/*.cpp.o
