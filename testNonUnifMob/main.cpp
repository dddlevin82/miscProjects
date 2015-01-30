#include <iostream>
#include <vector>
#include "Vector.h"
#include <stdlib.h>
#include <math.h>
using namespace std;

class Field {
	public:
		double posLo, posHi, mobLo, mobHi;
		Field(double posLo_, double posHi_, double mobLo_, double mobHi_) : posLo(posLo_), posHi(posHi_), mobLo(mobLo_), mobHi(mobHi_) {
		}
		double getMob (double pos) {
			double dxFrac = (pos - posLo) / (posHi - posLo);
			return fmin(mobHi, fmax(mobLo, mobLo + dxFrac * (mobHi - mobLo)));
		}
};


void applyRandForce(Vector &a, Field &f) {
	double mob = f.getMob(a[1]);
	double mag = mob * rand() / (double) RAND_MAX;
	double dir = rand() * 2 * M_PI / RAND_MAX;
	double dx = cos(dir) * mag;
	double dy = sin(dir) * mag;
	a[0] += dx;
	a[1] += dy;

}

void applyBondSpring(Vector &a, Vector &b, double eqLen, double kSp) {
	double dist = a.dist(b);
	double dx = dist - eqLen;
	Vector aToB = a.VTo(b);
	double magDist = kSp * dx;
	Vector UV = aToB.normalized();		
	UV *= magDist;
	a += UV;
	b -= UV;
}

void applyPosRestraint(Vector &a, Vector &b, double eqPos, double kSp) {
	double avg = (a[1] + b[1]) / 2;
	double dx = avg - eqPos;
	double magDist = kSp * dx;
	a[1] -= magDist;
	b[1] -= magDist;
}

void turn(Vector &a, Vector &b, double eqLen, double eqPos, double kSp, Field &f) {
	applyRandForce(a, f);
	applyRandForce(b, f);
	applyBondSpring(a, b, eqLen, kSp);
	applyPosRestraint(a, b, eqPos, kSp);
}

double director(Vector &a, Vector &b) {
	Vector diff = a - b;
	return atan2(diff[1], diff[0]);
}

int main() {
	Field f(0, 10, .1, 1);		
	Vector a(0, 2, 0);
	Vector b(0, 5, 0);
	double eqLen = 3;
	double kSp = .01;
	double eqPos = 5;
	for (int i=0; i<100000; i++) {
		turn(a, b, eqLen, eqPos, kSp, f);
		//cout << a[0] << " " << a[1] << " " << b[0] << " " << b[1] << endl;
		//cout << (a[1] + b[1]) / 2 << endl;
	}
	for (int i=0; i<10000000; i++) {
		turn(a, b, eqLen, eqPos, kSp, f);
		cout << director(a, b) << endl;
		//cout << a[0] << " " << a[1] << " " << b[0] << " " << b[1] << endl;
		//cout << (a[1] + b[1]) / 2 << endl;
	}
	/*
	for (int i=-10; i<20; i++) {
		cout << f.getMob(i) << endl;
	}
	*/

}
