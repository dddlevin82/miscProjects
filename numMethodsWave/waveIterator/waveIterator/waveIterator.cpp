// waveIterator.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <math.h>
#include <vector>
#include <map>
#include <ctime>
#include "Windows.h"
#include "Winbase.h"
 

using namespace std;

int round (double x) {
	return (int) floor(x + .5);
}

void zeroVector(vector<double> &ys, int numZeros) {
	for (int i=0; i<numZeros; i++) {
		ys.push_back(0);
	}
}

void mapOnGaussian(vector<double> &ys, double center, double centerHeight, double stdev, double dx) {
	double sqrtTwoPi = sqrt(2 * 3.141593);
	for (int i=0, ii=ys.size(); i<ii; i++) {
		ys[i] = centerHeight * exp(-pow(i * dx - center, 2) / (2 * stdev * stdev));
	}
}

vector<double> takeDerivative(vector<double> &ys, double xStep) {
	vector<double> derivative;
	derivative.reserve(ys.size());
	int ii = derivative.capacity() - 1;
	derivative.push_back((ys[1] - ys[0]) / xStep);
	
	for (int i=1; i<ii; i++) {
		derivative.push_back((ys[i+1] - ys[i-1]) / (2 * xStep));
	}
	derivative.push_back((ys[ys.size() - 1] - ys[ys.size() - 2]) / xStep);
	return derivative;
}

double correctorFunc(double y, double ddy, double alpha) {
	return alpha * y + ddy; //slideshow said it should be (- ddy), but I think that would make peaks higher and lows closer to zero
}

vector<double> predictorCorrector(vector<double> ys, double dx, double dt, double tRange, double alpha) {
	
	for (double time=0; time<tRange; time+=dt) {
		vector<double> ddYs = takeDerivative(takeDerivative(ys, dx), dx);
		vector<double> predictions;
		predictions.reserve(ys.size());

		for (int x=0, xx=ys.size(); x<xx; x++) {
			predictions.push_back(ys[x] + dt * correctorFunc(ys[x], ddYs[x], alpha));
		}
		vector<double> ddPredictions = takeDerivative(takeDerivative(ys, dx), dx);

		for (int x=0, xx=ys.size(); x<xx; x++) {
			ys[x] = .5 * (predictions[x] + ys[x] + dt * correctorFunc(predictions[x], ddPredictions[x], alpha));

		}
	}
	return ys;
}

vector<double> leapFrog(vector<double> ys, double dx, double dt, double tRange, double alpha) {
	vector<double> ysLast = ys;
	vector<double> ysCurrent = predictorCorrector(ys, dx, dt, dt, alpha);
	for (double time=0; time<tRange; time+=dt) {
		vector<double> ddYs = takeDerivative(takeDerivative(ys, dx), dx);

		for (int x=0, xx=ys.size(); x<xx; x++) {
			double last = ysCurrent[x];
			ysCurrent[x] = ysLast[x] + 2 * dt * correctorFunc(ysCurrent[x], dx, alpha);
			ysLast[x] = last;

		}
	}
	return ys;
}

void printResults(vector<double> ys, double dx) {
	double x = 0;
	for (int i=0; i<ys.size(); i++) {
		printf("%f, %f\n", x, ys[i]);
		x+=dx;
	}
}

int _tmain(int argc, _TCHAR* argv[])
{
	vector<double> ys;
	int xRange = 100;
	double tRange = 100;
	double dx = .0002;
	double dt = .0001;
	double alpha = .9;
	double waveCenter = .2;
	double centerHeight = 1;
	double stdev = .1;
	ys.reserve(round(xRange/dx));
	zeroVector(ys, round(xRange/dx));
	mapOnGaussian(ys, waveCenter, centerHeight, stdev, dx);
	
	time_t beforePredictor = time(0);
	DWORD foo = GetTickCount();
	vector<double> predictorCorrectorResult = predictorCorrector(ys, dx, dt, 2 * dt, alpha);
	time_t afterPredictor = time(0);
	printf("Time predictor corrector: %d", afterPredictor - beforePredictor);
	DWORD goo = GetTickCount();
	//printResults(predictorCorrectorResult, dx);
	


	return 0;
}

