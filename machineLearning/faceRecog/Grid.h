#ifndef ENUMERATED_GRID_H
#define	ENUMERATED_GRID_H 
#include <stdlib.h>
#include <iostream>
using namespace std;
template <class T>
class Grid {
	public:

		double *cs;
		double *rs;
		unsigned int nc, nr;
		T **zss;
		T *rawZs;
		void init(int nr_, int nc_) {
			nc = nc_;
			nr = nr_;
			//calloced doubles read as zero in g++ 
			cs = (double *) calloc(nc, sizeof(double));
			rs = (double *) calloc(nr, sizeof(double));
			rawZs = (T *) calloc(nc * nr, sizeof(T));
			zss = (T **) calloc(nr, sizeof(T *));
			for (unsigned int i=0; i<nr; i++) {
				zss[i] = &rawZs[i * nc];
			}	
		};
		Grid(){};
		Grid(int nr_, int nc_) {
			init(nr_, nc_);
		};
		double *operator[](int r) {
			return zss[r];
		}
		~Grid() { 
			free(cs);
			free(rs);
			free(zss);
			free(rawZs);
		};
		Grid(Grid &&other) {
			this->nc = other.nc;
			this->nr = other.nr;
			this->cs = other.cs;
			this->rs = other.rs;
			this->rawZs = other.rawZs;
			this->zss = other.zss;
			other.cs = NULL;
			other.rs = NULL;
			other.rawZs = NULL;
			other.zss = NULL;
		};
		Grid(Grid &other) {
			this->nc = other.nc;
			this->nr = other.nr;
			this->xs = (double *) malloc(this->nc * sizeof(T));
			this->ys = (double *) malloc(this->nr * sizeof(T));
			this->zss = (double **) malloc(this->nr * sizeof(T *));
			this->rawZs = (double *) malloc(this->nc * this->nr * sizeof(T));
			memcpy(this->xs, other.xs, this->nc);
			memcpy(this->ys, other.ys, this->nr);
			memcpy(this->zss, other.zss, this->nc);
			memcpy(this->rawZs, other.rawZs, this->nc * this->nr);
		};
		Grid operator=(Grid &&other) {
			this->nc = other.nc;
			this->nr = other.nr;
			this->xs = other.xs;
			this->ys = other.ys;
			this->rawZs = other.rawZs;
			this->zss = other.zss;
			other.xs = NULL;
			other.ys = NULL;
			other.rawZs = NULL;
			other.zss = NULL;
			return *this;
		}
		Grid operator=(Grid &other) {
			this->nc = other.nc;
			this->nr = other.nr;
			this->xs = (double *) malloc(this->nc, sizeof(T));
			this->ys = (double *) malloc(this->nr, sizeof(T));
			this->zss = (double **) malloc(this->nr, sizeof(T *));
			this->rawZs = (double *) malloc(this->nc * this->nr, sizeof(T));
			memcpy(this->xs, other.xs, this->nc);
			memcpy(this->ys, other.ys, this->nr);
			memcpy(this->zss, other.zss, this->nc);
			memcpy(this->rawZs, other.rawZs, this->nc * this->nr);
			return *this;
		}
};
//this is a surface in R3.  x -> t, y-> r, z -> G(r, t)
//See "The van Hove distribution function for Brownian hard spheres: Dynamical test particle theory and computer simulations for bulk dyanmic" by Hokens, Fortini, Archer, JCP, 2010
#endif
