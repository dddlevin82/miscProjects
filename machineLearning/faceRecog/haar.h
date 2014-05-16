

#ifndef HAAR_H
#define HAAR_H
#include "Grid.h"
double haarTwoHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax);
double haarTwoVert(Grid &img, int rmin, int rmax, int cmin, int cmax);

double haarThreeHoriz(Grid &img, int rmin, int rmax, int cmin, int cmax);
double haarThreeVert(Grid &img, int rmin, int rmax, int cmin, int cmax);

double haarFour(Grid &img, int rmin, int rmax, int cmin, int cmax);

#endif
