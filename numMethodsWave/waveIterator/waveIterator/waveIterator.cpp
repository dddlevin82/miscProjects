// waveIterator.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <math.h>
#include <vector>
#include <map>

using namespace std;

int round (double x) {
	return floor(x + .5);
}

void zeroVector(vector<double> &ys) {
	for (int i=0, int ii=ys.size(); i<ii; i++) {
		ys[0] = 0;
	}
}

void mapOnGaussian(vector<double> &ys, double center, double centerHeight, double stdev, double dx) {
	double sqrtTwoPi = sqrt(2 * 3.141593);
	for (int i=0, ii=ys.size(); i<ii; i++) {
		ys[i] = 1 / (stdev * sqrtTwoPi) * exp(-pow(i * dx - center, 2) / (2 * stdev * stdev));
	}
}

vector<double> ddx(vector<double> &ys, double xInit, double xStep) {
	vector<double> derivative;
	derivative.reserve(ys.size());
	derivative[0] = 0;
	derivative[derivative.size() - 1] = 0;
	for (int i=0, ii=derivative.size()-1; i<ii; i++) {

	}

}

int _tmain(int argc, _TCHAR* argv[])
{
	int foo = 5;
	vector<double> ys;
	int xRange = 100;
	int yRange = 100;
	double dx = .01;
	double dy = .01;
	double waveCenter = 10;
	double centerHeight = 1;
	double stdev = 1;
	ys.reserve(round(xRange/dx));
	zeroVector(ys);
	mapOnGaussian(ys, waveCenter, centerHeight, stdev, dx);
	return 0;
}

