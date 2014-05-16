#ifndef VECTOR_H
#define VECTOR_H

#include <math.h>
#include <iostream>
using namespace std;
const double EPSILON = .000001;
class Vector{
	public:
		double x,y,z;
		Vector():x(0),y(0),z(0){
		}
		Vector(double x, double y):x(x),y(y),z(0){
		}
		Vector( double x,double y,double z ):x(x),y(y),z(z){
		}
		Vector VTo(Vector &v) {
			return Vector(v.x - x, v.y - y, v.z - z);
		}
		operator double*(){
			return &x;
		}
		operator const double *(){
			return &x;
		}
		double &operator[]( int n ){
			return (&x)[n]; 
		}
		double operator[]( int n )const{
			return (&x)[n]; 
		}
		Vector operator-()const{
			return Vector( -x,-y,-z ); 
		}
		Vector operator*( double scale )const{
			return Vector( x*scale,y*scale,z*scale );
		}
		Vector operator*( const Vector &q )const{
			return Vector( x*q.x,y*q.y,z*q.z );
		}
		Vector operator/( double scale )const{
			return Vector( x/scale,y/scale,z/scale );
		}
		Vector operator/( const Vector &q )const{
			return Vector( x/q.x,y/q.y,z/q.z );
		}
		Vector operator+( const Vector &q )const{
			return Vector( x+q.x,y+q.y,z+q.z );
		}
		Vector operator-( const Vector &q )const{
			return Vector( x-q.x,y-q.y,z-q.z );
		}
		Vector &operator*=( double scale ){
			x*=scale;y*=scale;z*=scale;return *this;
		}
		Vector &operator*=( const Vector &q ){
			x*=q.x;y*=q.y;z*=q.z;return *this;
		}
		Vector &operator/=( double scale ){
			x/=scale;y/=scale;z/=scale;return *this;
		}
		Vector &operator/=( const Vector &q ){
			x/=q.x;y/=q.y;z/=q.z;return *this;
		}
		Vector &operator+=( const Vector &q ){
			x+=q.x;y+=q.y;z+=q.z;return *this;
		}
		Vector &operator-=( const Vector &q ){
			x-=q.x;y-=q.y;z-=q.z;return *this;
		}
		bool operator<( const Vector &q )const{
			if( fabs(x-q.x)>EPSILON ) return x<q.x ? true : false;
			if( fabs(y-q.y)>EPSILON ) return y<q.y ? true : false;
			return fabs(z-q.z)>EPSILON && z<q.z;
		}
		bool operator==( const Vector &q )const{
			return fabs(x-q.x)<=EPSILON && fabs(y-q.y)<=EPSILON && fabs(z-q.z)<=EPSILON;
		}
		bool operator!=( const Vector &q )const{
			return fabs(x-q.x)>EPSILON || fabs(y-q.y)>EPSILON || fabs(z-q.z)>EPSILON;
		}
		double dot( const Vector &q )const{
			return x*q.x+y*q.y+z*q.z;
		}
		Vector cross( const Vector &q )const{
			return Vector( y*q.z-z*q.y,z*q.x-x*q.z,x*q.y-y*q.x );
		}
		double len()const{
			return sqrt(x*x+y*y+z*z);
		}
		double dist( const Vector &q )const{
			double dx=x-q.x,dy=y-q.y,dz=z-q.z;return sqrt(dx*dx+dy*dy+dz*dz);
		}
		double distSqr( const Vector &q) {
			double dx=x-q.x,dy=y-q.y,dz=z-q.z;return dx*dx+dy*dy+dz*dz;
		}
		Vector normalized()const{
			double l=len();return Vector( x/l,y/l,z/l );
		}
		void normalize(){
			double l=len();x/=l;y/=l;z/=l;
		}
		double yaw()const{
			return -atan2f( x,z );
		}
		double pitch()const{
			return -atan2f( y,sqrtf( x*x+z*z ) );
		}
		void clear(){
			x=y=z=0;
		}
		void rotateccw() {
			const double dx = x;
			const double dy = y;
			x = -dy;
			y = dx;
		}
		void rotatecw() {
			const double dx = x;
			const double dy = y;
			x = dy;
			y = -dx;
		}
		void print() {
			cout << "x: " << x << " y: " << y << " z: " << z << endl;
		}
};

#endif
