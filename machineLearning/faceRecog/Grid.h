#ifndef GRID_H
#define	GRID_H
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <iostream>
using namespace std;
class Grid {
	public:

		double *cs;
		double *rs;
		unsigned int nc, nr;
		double **zss;
		double *rawZs;
		void init(int nr_, int nc_) {
			nc = nc_;
			nr = nr_;
			//calloced doubles read as zero in g++ 
			cs = (double *) calloc(nc, sizeof(double));
			rs = (double *) calloc(nr, sizeof(double));
			rawZs = (double *) calloc(nc * nr, sizeof(double));
			zss = (double **) calloc(nr, sizeof(double *));
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
			this->cs = (double *) malloc(this->nc * sizeof(double));
			this->rs = (double *) malloc(this->nr * sizeof(double));
			this->zss = (double **) malloc(this->nr * sizeof(double *));
			this->rawZs = (double *) malloc(this->nc * this->nr * sizeof(double));
			for (unsigned int i=0; i<this->nr; i++) {
				zss[i] = &this->rawZs[i * this->nc];
			}	
			memcpy(this->cs, other.cs, this->nc);
			memcpy(this->rs, other.rs, this->nr);
			memcpy(this->rawZs, other.rawZs, this->nc * this->nr);
		};
		Grid operator=(Grid &&other) {
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
			return *this;
		}
		Grid operator=(Grid &other) {
			this->nc = other.nc;
			this->nr = other.nr;
			this->cs = (double *) malloc(this->nc * sizeof(double));
			this->rs = (double *) malloc(this->nr * sizeof(double));
			this->zss = (double **) malloc(this->nr * sizeof(double *));
			this->rawZs = (double *) malloc(this->nc * this->nr * sizeof(double));
			for (unsigned int i=0; i<this->nr; i++) {
				zss[i] = &this->rawZs[i * this->nc];
			}	
			memcpy(this->cs, other.cs, this->nc);
			memcpy(this->rs, other.rs, this->nr);
			memcpy(this->rawZs, other.rawZs, this->nc * this->nr);
			return *this;
		}
};
//this is a surface in R3.  x -> t, y-> r, z -> G(r, t)
//See "The van Hove distribution function for Brownian hard spheres: Dynamical test particle theory and computer simulations for bulk dyanmic" by Hokens, Fortini, Archer, JCP, 2010
#endif
